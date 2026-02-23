from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    APP_NAME: str = "BundyClock Face Recognition Service"
    PORT: int = 5001
    DEBUG: bool = True

    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:8080",
    ]

    # Storage
    FACE_IMAGES_DIR: str = "./data/faces"
    EMBEDDINGS_DIR: str = "./data/embeddings"

    # DeepFace
    DEEPFACE_MODEL: str = "VGG-Face"   # Options: VGG-Face, Facenet, ArcFace, DeepFace
    DEEPFACE_DETECTOR: str = "opencv"  # Options: opencv, ssd, mtcnn, retinaface
    DEEPFACE_DISTANCE_METRIC: str = "cosine"
    CONFIDENCE_THRESHOLD: float = 0.6

    class Config:
        env_file = ".env"


settings = Settings()
