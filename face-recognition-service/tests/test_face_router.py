"""
Router-level tests for the face recognition FastAPI service.

All calls to the real face_service module are patched so that:
  - No DeepFace model is loaded.
  - No files are written to disk.
  - Tests run fast and deterministically.

Run with:
    cd face-recognition-service
    source .venv/Scripts/activate   # Windows Git Bash
    pytest tests/ -v
"""

import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

# ── Constants ─────────────────────────────────────────────────────────────────
MOCK_EMPLOYEE_ID = "ae856639-b7c7-43b2-a864-bc3027517011"
# Minimal bytes that pass the image content-type check
DUMMY_IMAGE = b"\xff\xd8\xff\xe0" + b"\x00" * 50  # JPEG-like header


# ── /health ───────────────────────────────────────────────────────────────────
class TestHealth:
    def test_returns_200_and_ok(self):
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "ok"

    def test_response_has_json_content_type(self):
        response = client.get("/health")
        assert "application/json" in response.headers["content-type"]


# ── /verify-face ──────────────────────────────────────────────────────────────
class TestVerifyFace:
    def test_missing_image_returns_422(self):
        """Endpoint requires the 'image' file part — omitting it is a validation error."""
        response = client.post("/verify-face")
        assert response.status_code == 422

    def test_matched_face_returns_employee_id_and_score(self):
        mock_result = {
            "matched": True,
            "employee_id": MOCK_EMPLOYEE_ID,
            "confidence_score": 0.97,
            "message": "Face matched",
        }
        with patch("app.routers.face.face_service.verify_face", return_value=mock_result):
            response = client.post(
                "/verify-face",
                files={"image": ("face.jpg", DUMMY_IMAGE, "image/jpeg")},
            )
        assert response.status_code == 200
        body = response.json()
        assert body["matched"] is True
        assert body["employee_id"] == MOCK_EMPLOYEE_ID
        assert body["confidence_score"] == pytest.approx(0.97)

    def test_unmatched_face_returns_matched_false(self):
        mock_result = {
            "matched": False,
            "employee_id": None,
            "confidence_score": 0.0,
            "message": "No matching face found",
        }
        with patch("app.routers.face.face_service.verify_face", return_value=mock_result):
            response = client.post(
                "/verify-face",
                files={"image": ("face.jpg", DUMMY_IMAGE, "image/jpeg")},
            )
        assert response.status_code == 200
        body = response.json()
        assert body["matched"] is False
        assert body["employee_id"] is None

    def test_no_embeddings_registered_returns_not_matched(self):
        mock_result = {
            "matched": False,
            "employee_id": None,
            "confidence_score": 0.0,
            "message": "No registered faces found",
        }
        with patch("app.routers.face.face_service.verify_face", return_value=mock_result):
            response = client.post(
                "/verify-face",
                files={"image": ("face.jpg", DUMMY_IMAGE, "image/jpeg")},
            )
        assert response.status_code == 200
        assert response.json()["matched"] is False

    def test_non_image_file_returns_400(self):
        """Uploading a text file should be rejected by the content-type guard."""
        response = client.post(
            "/verify-face",
            files={"image": ("data.txt", b"not an image", "text/plain")},
        )
        assert response.status_code == 400

    def test_service_exception_returns_500(self):
        with patch(
            "app.routers.face.face_service.verify_face",
            side_effect=RuntimeError("unexpected DeepFace error"),
        ):
            response = client.post(
                "/verify-face",
                files={"image": ("face.jpg", DUMMY_IMAGE, "image/jpeg")},
            )
        assert response.status_code == 500


# ── /register-face ────────────────────────────────────────────────────────────
class TestRegisterFace:
    def test_missing_image_returns_422(self):
        response = client.post(
            "/register-face",
            data={"employee_id": MOCK_EMPLOYEE_ID},
        )
        assert response.status_code == 422

    def test_missing_employee_id_returns_422(self):
        response = client.post(
            "/register-face",
            files={"image": ("face.jpg", DUMMY_IMAGE, "image/jpeg")},
        )
        assert response.status_code == 422

    def test_non_image_file_returns_400(self):
        response = client.post(
            "/register-face",
            data={"employee_id": MOCK_EMPLOYEE_ID},
            files={"image": ("data.csv", b"col1,col2", "text/csv")},
        )
        assert response.status_code == 400

    def test_successful_registration_returns_success_true(self):
        mock_result = {
            "success": True,
            "employee_id": MOCK_EMPLOYEE_ID,
            "embedding_path": f"data/embeddings/{MOCK_EMPLOYEE_ID}.json",
            "message": "Face registered successfully.",
        }
        with patch("app.routers.face.face_service.register_face", return_value=mock_result):
            response = client.post(
                "/register-face",
                data={"employee_id": MOCK_EMPLOYEE_ID},
                files={"image": ("face.jpg", DUMMY_IMAGE, "image/jpeg")},
            )
        assert response.status_code == 200
        body = response.json()
        assert body["success"] is True
        assert body["employee_id"] == MOCK_EMPLOYEE_ID

    def test_no_face_detected_returns_success_false(self):
        mock_result = {
            "success": False,
            "employee_id": MOCK_EMPLOYEE_ID,
            "embedding_path": None,
            "message": "No face detected in the provided image.",
        }
        with patch("app.routers.face.face_service.register_face", return_value=mock_result):
            response = client.post(
                "/register-face",
                data={"employee_id": MOCK_EMPLOYEE_ID},
                files={"image": ("face.jpg", DUMMY_IMAGE, "image/jpeg")},
            )
        assert response.status_code == 200
        body = response.json()
        assert body["success"] is False
        assert "No face detected" in body["message"]

    def test_service_exception_returns_500(self):
        with patch(
            "app.routers.face.face_service.register_face",
            side_effect=RuntimeError("disk full"),
        ):
            response = client.post(
                "/register-face",
                data={"employee_id": MOCK_EMPLOYEE_ID},
                files={"image": ("face.jpg", DUMMY_IMAGE, "image/jpeg")},
            )
        assert response.status_code == 500

    def test_can_register_same_employee_multiple_times(self):
        """
        The service accumulates embeddings per employee.
        Verify the router forwards every call without error.
        """
        call_count = 0

        def mock_register(employee_id: str, image_bytes: bytes):
            nonlocal call_count
            call_count += 1
            return {
                "success": True,
                "employee_id": employee_id,
                "embedding_path": f"data/embeddings/{employee_id}.json",
                "message": "Face registered successfully.",
            }

        with patch("app.routers.face.face_service.register_face", side_effect=mock_register):
            for _ in range(3):
                response = client.post(
                    "/register-face",
                    data={"employee_id": MOCK_EMPLOYEE_ID},
                    files={"image": ("face.jpg", DUMMY_IMAGE, "image/jpeg")},
                )
                assert response.status_code == 200

        assert call_count == 3

