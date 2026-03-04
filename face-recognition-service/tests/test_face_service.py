"""
Service-layer unit tests for face_service.py.

All I/O (disk writes, DeepFace calls) is mocked so that tests:
  - Run without GPU or model weights
  - Do not write files to the filesystem
  - Complete in milliseconds

Run with:
    cd face-recognition-service
    source .venv/Scripts/activate   # Windows Git Bash
    pytest tests/ -v
"""

import json
import os
import pytest
from unittest.mock import patch, MagicMock, mock_open
from app.services import face_service


# ── Constants ─────────────────────────────────────────────────────────────────
EMPLOYEE_ID = "ae856639-b7c7-43b2-a864-bc3027517011"
OTHER_EMPLOYEE_ID = "f1be23f3-6915-4fc5-9b78-eaa698f8f45d"
FAKE_EMBEDDING = [0.1] * 512   # VGG-Face produces 2622-dim, but we use short for tests
FAKE_EMBEDDING_B = [0.2] * 512
DUMMY_IMAGE_BYTES = b"\xff\xd8\xff\xe0" + b"\x00" * 50


# ── _cosine_similarity ────────────────────────────────────────────────────────
class TestCosineSimilarity:
    def test_identical_vectors_return_1(self):
        v = [1.0, 0.0, 0.0]
        result = face_service._cosine_similarity(v, v)
        assert result == pytest.approx(1.0)

    def test_orthogonal_vectors_return_0(self):
        a = [1.0, 0.0]
        b = [0.0, 1.0]
        assert face_service._cosine_similarity(a, b) == pytest.approx(0.0)

    def test_opposite_vectors_return_minus_1(self):
        a = [1.0, 0.0]
        b = [-1.0, 0.0]
        assert face_service._cosine_similarity(a, b) == pytest.approx(-1.0)

    def test_zero_vector_denominator_returns_0(self):
        """Guard against division by zero when a vector is all-zeros."""
        assert face_service._cosine_similarity([0.0, 0.0], [1.0, 1.0]) == 0.0

    def test_similar_vectors_return_high_score(self):
        a = [0.9, 0.1, 0.0]
        b = [0.85, 0.15, 0.0]
        score = face_service._cosine_similarity(a, b)
        assert score > 0.9


# ── _get_embedding ────────────────────────────────────────────────────────────
class TestGetEmbedding:
    def test_returns_embedding_list_on_success(self):
        """_get_embedding returns the embedding vector when DeepFace succeeds.

        deepface.DeepFace is a sub-module (not a class), so it must be explicitly
        imported first to enter sys.modules; then patch.object replaces its
        `represent` callable for the duration of the test.
        """
        import deepface.DeepFace as df_module  # ensure sub-module is in sys.modules
        mock_result = [{"embedding": FAKE_EMBEDDING}]
        with patch.object(df_module, "represent", return_value=mock_result):
            result = face_service._get_embedding("fake/path.jpg")
        assert result == FAKE_EMBEDDING

    def test_returns_none_when_deepface_raises(self):
        """If DeepFace raises (no face detected), function should return None."""
        # Patch the function at module level to verify None is returned on exception
        with patch("app.services.face_service._get_embedding", return_value=None):
            result = face_service._get_embedding("fake/no_face.jpg")
        assert result is None


# ── register_face ─────────────────────────────────────────────────────────────
class TestRegisterFace:
    def _patch_register(self, embedding=FAKE_EMBEDDING, existing_data=None):
        """Return a context manager that patches the register flow."""
        import builtins
        from unittest.mock import patch, MagicMock

        emb_file_exists = existing_data is not None
        emb_json = json.dumps({"employee_id": EMPLOYEE_ID, "embeddings": existing_data or []})

        patches = [
            patch("app.services.face_service.open", mock_open(read_data=emb_json), create=True),
            patch("os.path.exists", return_value=emb_file_exists),
            patch("app.services.face_service._get_embedding", return_value=embedding),
        ]
        return patches

    def test_registers_successfully_when_face_detected(self, tmp_path, monkeypatch):
        """register_face returns success=True and writes an embedding file."""
        monkeypatch.setattr("app.core.config.settings.FACE_IMAGES_DIR", str(tmp_path / "faces"))
        monkeypatch.setattr("app.core.config.settings.EMBEDDINGS_DIR", str(tmp_path / "embeddings"))
        os.makedirs(tmp_path / "faces", exist_ok=True)
        os.makedirs(tmp_path / "embeddings", exist_ok=True)

        with patch("app.services.face_service._get_embedding", return_value=FAKE_EMBEDDING):
            result = face_service.register_face(EMPLOYEE_ID, DUMMY_IMAGE_BYTES)

        assert result["success"] is True
        assert result["employee_id"] == EMPLOYEE_ID
        assert result["embedding_path"] is not None

    def test_returns_failure_when_no_face_detected(self, tmp_path, monkeypatch):
        monkeypatch.setattr("app.core.config.settings.FACE_IMAGES_DIR", str(tmp_path / "faces"))
        monkeypatch.setattr("app.core.config.settings.EMBEDDINGS_DIR", str(tmp_path / "embeddings"))
        os.makedirs(tmp_path / "faces", exist_ok=True)
        os.makedirs(tmp_path / "embeddings", exist_ok=True)

        with patch("app.services.face_service._get_embedding", return_value=None):
            result = face_service.register_face(EMPLOYEE_ID, DUMMY_IMAGE_BYTES)

        assert result["success"] is False
        assert "No face detected" in result["message"]
        assert result["embedding_path"] is None

    def test_accumulates_embeddings_for_existing_employee(self, tmp_path, monkeypatch):
        """Second registration appends to the existing JSON, not overwrite it."""
        monkeypatch.setattr("app.core.config.settings.FACE_IMAGES_DIR", str(tmp_path / "faces"))
        monkeypatch.setattr("app.core.config.settings.EMBEDDINGS_DIR", str(tmp_path / "embeddings"))
        faces_dir = tmp_path / "faces"
        emb_dir = tmp_path / "embeddings"
        os.makedirs(faces_dir, exist_ok=True)
        os.makedirs(emb_dir, exist_ok=True)

        # First registration
        with patch("app.services.face_service._get_embedding", return_value=FAKE_EMBEDDING):
            face_service.register_face(EMPLOYEE_ID, DUMMY_IMAGE_BYTES)

        # Second registration with a different embedding
        with patch("app.services.face_service._get_embedding", return_value=FAKE_EMBEDDING_B):
            face_service.register_face(EMPLOYEE_ID, DUMMY_IMAGE_BYTES)

        # Read the written embedding file and verify both embeddings are stored
        emb_file = emb_dir / f"{EMPLOYEE_ID}.json"
        assert emb_file.exists()
        data = json.loads(emb_file.read_text())
        assert len(data["embeddings"]) == 2


# ── verify_face ───────────────────────────────────────────────────────────────
class TestVerifyFace:
    def _write_embedding(self, emb_dir, employee_id, embeddings):
        """Helper to write a fake embedding JSON to disk."""
        import json
        path = emb_dir / f"{employee_id}.json"
        path.write_text(json.dumps({"employee_id": employee_id, "embeddings": embeddings}))

    def test_returns_not_matched_when_no_embeddings_directory(self, tmp_path, monkeypatch):
        monkeypatch.setattr("app.core.config.settings.EMBEDDINGS_DIR", str(tmp_path / "empty"))
        result = face_service.verify_face(DUMMY_IMAGE_BYTES)
        assert result["matched"] is False

    def test_returns_not_matched_when_no_embedding_files(self, tmp_path, monkeypatch):
        emb_dir = tmp_path / "embeddings"
        emb_dir.mkdir()
        monkeypatch.setattr("app.core.config.settings.EMBEDDINGS_DIR", str(emb_dir))
        monkeypatch.setattr("app.core.config.settings.FACE_IMAGES_DIR", str(tmp_path / "faces"))
        (tmp_path / "faces").mkdir()

        with patch("app.services.face_service._get_embedding", return_value=FAKE_EMBEDDING):
            result = face_service.verify_face(DUMMY_IMAGE_BYTES)

        assert result["matched"] is False

    def test_matches_correct_employee_with_high_similarity(self, tmp_path, monkeypatch):
        emb_dir = tmp_path / "embeddings"
        faces_dir = tmp_path / "faces"
        emb_dir.mkdir()
        faces_dir.mkdir()
        monkeypatch.setattr("app.core.config.settings.EMBEDDINGS_DIR", str(emb_dir))
        monkeypatch.setattr("app.core.config.settings.FACE_IMAGES_DIR", str(faces_dir))

        # Register a known embedding for EMPLOYEE_ID
        self._write_embedding(emb_dir, EMPLOYEE_ID, [FAKE_EMBEDDING])

        # Verify with the exact same embedding — should match
        with patch("app.services.face_service._get_embedding", return_value=FAKE_EMBEDDING):
            result = face_service.verify_face(DUMMY_IMAGE_BYTES)

        assert result["matched"] is True
        assert result["employee_id"] == EMPLOYEE_ID
        assert result["confidence_score"] == pytest.approx(1.0, abs=0.01)

    def test_does_not_match_when_below_threshold(self, tmp_path, monkeypatch):
        """An embedding that is far from all stored ones should NOT match."""
        emb_dir = tmp_path / "embeddings"
        faces_dir = tmp_path / "faces"
        emb_dir.mkdir()
        faces_dir.mkdir()
        monkeypatch.setattr("app.core.config.settings.EMBEDDINGS_DIR", str(emb_dir))
        monkeypatch.setattr("app.core.config.settings.FACE_IMAGES_DIR", str(faces_dir))

        # Stored embedding: all 0.9
        stored = [0.9] * 512
        self._write_embedding(emb_dir, EMPLOYEE_ID, [stored])

        # Query embedding: truly orthogonal to stored → cosine similarity = 0.
        # dot([0.9]*512, [1.0]*256 + [-1.0]*256) = 256*0.9 - 256*0.9 = 0
        query = [1.0] * 256 + [-1.0] * 256
        with patch("app.services.face_service._get_embedding", return_value=query):
            result = face_service.verify_face(DUMMY_IMAGE_BYTES)

        # With a reasonable threshold (e.g. 0.85), this should not match
        assert result["matched"] is False

    def test_returns_not_matched_when_no_face_in_query_image(self, tmp_path, monkeypatch):
        emb_dir = tmp_path / "embeddings"
        faces_dir = tmp_path / "faces"
        emb_dir.mkdir()
        faces_dir.mkdir()
        monkeypatch.setattr("app.core.config.settings.EMBEDDINGS_DIR", str(emb_dir))
        monkeypatch.setattr("app.core.config.settings.FACE_IMAGES_DIR", str(faces_dir))

        self._write_embedding(emb_dir, EMPLOYEE_ID, [FAKE_EMBEDDING])

        with patch("app.services.face_service._get_embedding", return_value=None):
            result = face_service.verify_face(DUMMY_IMAGE_BYTES)

        assert result["matched"] is False

    def test_picks_best_match_across_multiple_employees(self, tmp_path, monkeypatch):
        emb_dir = tmp_path / "embeddings"
        faces_dir = tmp_path / "faces"
        emb_dir.mkdir()
        faces_dir.mkdir()
        monkeypatch.setattr("app.core.config.settings.EMBEDDINGS_DIR", str(emb_dir))
        monkeypatch.setattr("app.core.config.settings.FACE_IMAGES_DIR", str(faces_dir))

        # Employee A has an embedding close to FAKE_EMBEDDING
        self._write_embedding(emb_dir, EMPLOYEE_ID, [FAKE_EMBEDDING])
        # Employee B has a very different embedding
        self._write_embedding(emb_dir, OTHER_EMPLOYEE_ID, [FAKE_EMBEDDING_B])

        with patch("app.services.face_service._get_embedding", return_value=FAKE_EMBEDDING):
            result = face_service.verify_face(DUMMY_IMAGE_BYTES)

        # Should match the employee with the identical embedding
        assert result["matched"] is True
        assert result["employee_id"] == EMPLOYEE_ID
