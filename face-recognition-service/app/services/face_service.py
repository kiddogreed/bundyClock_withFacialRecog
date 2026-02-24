"""
Face recognition service using DeepFace.

Responsibilities:
- Register a face: save image + compute/store embedding vector as .npy file
- Verify a face: compare input image against all stored embeddings, return best match
"""

import os
import json
import uuid
import logging
from pathlib import Path
from typing import Optional, Tuple

import numpy as np

from app.core.config import settings

logger = logging.getLogger(__name__)

# Ensure storage directories exist
Path(settings.FACE_IMAGES_DIR).mkdir(parents=True, exist_ok=True)
Path(settings.EMBEDDINGS_DIR).mkdir(parents=True, exist_ok=True)


def _get_embedding(image_path: str) -> Optional[list]:
    """
    Generate face embedding using DeepFace.
    Returns list of floats or None if no face detected.
    """
    try:
        from deepface import DeepFace  # lazy import — DeepFace is heavy
        result = DeepFace.represent(
            img_path=image_path,
            model_name=settings.DEEPFACE_MODEL,
            detector_backend=settings.DEEPFACE_DETECTOR,
            enforce_detection=True,
        )
        if result:
            return result[0]["embedding"]
    except Exception as e:
        logger.warning("DeepFace embedding failed: %s", e)
    return None


def _cosine_similarity(a: list, b: list) -> float:
    """Return cosine similarity between two vectors (0–1, higher = more similar)."""
    a_arr = np.array(a)
    b_arr = np.array(b)
    denom = np.linalg.norm(a_arr) * np.linalg.norm(b_arr)
    if denom == 0:
        return 0.0
    return float(np.dot(a_arr, b_arr) / denom)


def register_face(employee_id: str, image_bytes: bytes) -> dict:
    """
    Save face image and compute embedding for the given employee.
    Embedding is stored as a JSON file named {employee_id}.json.
    """
    # Save raw image
    img_filename = f"{employee_id}_{uuid.uuid4().hex[:8]}.jpg"
    img_path = os.path.join(settings.FACE_IMAGES_DIR, img_filename)
    with open(img_path, "wb") as f:
        f.write(image_bytes)

    # Compute embedding
    embedding = _get_embedding(img_path)
    if embedding is None:
        return {
            "success": False,
            "employee_id": employee_id,
            "embedding_path": None,
            "message": "No face detected in the provided image.",
        }

    # Save embedding — accumulate all photos for this employee (improves accuracy)
    emb_path = os.path.join(settings.EMBEDDINGS_DIR, f"{employee_id}.json")
    if os.path.exists(emb_path):
        with open(emb_path) as f:
            existing = json.load(f)
        # Support both old single-embedding format and new list format
        existing_list = existing.get("embeddings") or [existing.get("embedding")]
        existing_list.append(embedding)
    else:
        existing_list = [embedding]

    with open(emb_path, "w") as f:
        json.dump({"employee_id": employee_id, "embeddings": existing_list}, f)

    logger.info("Face registered for employee %s (total embeddings: %d)", employee_id, len(existing_list))
    return {
        "success": True,
        "employee_id": employee_id,
        "embedding_path": emb_path,
        "message": f"Face registered successfully. ({len(existing_list)} photo(s) stored)",
    }


def verify_face(image_bytes: bytes) -> dict:
    """
    Compare a captured face against all stored embeddings.
    Returns the best match above the confidence threshold.
    """
    # Save probe image temporarily
    tmp_path = os.path.join(settings.FACE_IMAGES_DIR, f"probe_{uuid.uuid4().hex}.jpg")
    try:
        with open(tmp_path, "wb") as f:
            f.write(image_bytes)

        probe_embedding = _get_embedding(tmp_path)
        if probe_embedding is None:
            return {
                "matched": False,
                "employee_id": None,
                "confidence_score": None,
                "message": "No face detected in the probe image.",
            }

        # Compare against all stored embeddings; take best score per employee
        best_match_id: Optional[str] = None
        best_score: float = 0.0

        emb_dir = Path(settings.EMBEDDINGS_DIR)
        for emb_file in emb_dir.glob("*.json"):
            with open(emb_file) as f:
                data = json.load(f)
            # Support both old {"embedding": [...]} and new {"embeddings": [[...],[...]]}
            stored_embs = data.get("embeddings") or [data.get("embedding")]
            for stored_emb in stored_embs:
                if stored_emb is None:
                    continue
                score = _cosine_similarity(probe_embedding, stored_emb)
                if score > best_score:
                    best_score = score
                    best_match_id = data["employee_id"]

        threshold = settings.CONFIDENCE_THRESHOLD
        matched = best_score >= threshold

        logger.info(
            "Verification result: matched=%s, employee=%s, score=%.4f",
            matched, best_match_id, best_score,
        )
        return {
            "matched": matched,
            "employee_id": best_match_id if matched else None,
            "confidence_score": round(best_score, 4),
            "message": "Match found." if matched else "No match found.",
        }
    finally:
        # Clean up probe image
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
