from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.schemas.face_schemas import VerifyFaceResponse, RegisterFaceResponse
from app.services import face_service
import traceback
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/verify-face", response_model=VerifyFaceResponse)
async def verify_face(image: UploadFile = File(..., description="Face image (JPEG/PNG)")):
    """
    Verify a captured face against all registered employee faces.
    Returns the matched employee ID and confidence score.
    """
    if not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    try:
        image_bytes = await image.read()
        result = face_service.verify_face(image_bytes)
        return VerifyFaceResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        logger.error("verify_face error: %s", traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"{type(e).__name__}: {e}")


@router.post("/register-face", response_model=RegisterFaceResponse)
async def register_face(
    employee_id: str = Form(..., description="UUID of the employee"),
    image: UploadFile = File(..., description="Face image (JPEG/PNG)"),
):
    """
    Register a face for an employee.
    Computes and stores the embedding vector for future verification.
    """
    if not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    try:
        image_bytes = await image.read()
        result = face_service.register_face(employee_id, image_bytes)
        return RegisterFaceResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        logger.error("register_face error: %s", traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"{type(e).__name__}: {e}")
