from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import face
from app.core.config import settings

app = FastAPI(
    title="BundyClock Face Recognition Service",
    description="Local face recognition microservice using DeepFace",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(face.router, prefix="", tags=["Face Recognition"])


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "face-recognition-service"}
