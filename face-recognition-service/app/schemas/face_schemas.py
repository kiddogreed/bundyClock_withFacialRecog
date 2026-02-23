from pydantic import BaseModel
from typing import Optional
import uuid


class VerifyFaceRequest(BaseModel):
    """Used only when sending base64; for multipart use UploadFile directly."""
    image_base64: Optional[str] = None


class VerifyFaceResponse(BaseModel):
    matched: bool
    employee_id: Optional[str] = None
    confidence_score: Optional[float] = None
    message: str


class RegisterFaceResponse(BaseModel):
    success: bool
    employee_id: str
    embedding_path: Optional[str] = None
    message: str
