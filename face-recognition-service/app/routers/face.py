from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.schemas.face_schemas import VerifyFaceResponse, RegisterFaceResponse
from app import services

router = APIRouter()


@router.post("/verify-face", response_model=VerifyFaceResponse)
async def verify_face(image: UploadFile = File(..., description="Face image (JPEG/PNG)")):
    """
    Verify a captured face against all registered employee faces.
    Returns the matched employee ID and confidence score.
    """
    if not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    image_bytes = await image.read()
    result = services.face_service.verify_face(image_bytes)
    return VerifyFaceResponse(**result)


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

    image_bytes = await image.read()
    result = services.face_service.register_face(employee_id, image_bytes)
    return RegisterFaceResponse(**result)
