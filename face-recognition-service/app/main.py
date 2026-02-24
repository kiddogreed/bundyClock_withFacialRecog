from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.routers import face
from app.core.config import settings
import traceback
import logging

logger = logging.getLogger(__name__)

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


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    tb = traceback.format_exc()
    logger.error("Unhandled exception on %s %s:\n%s", request.method, request.url, tb)
    return JSONResponse(
        status_code=500,
        content={"detail": f"{type(exc).__name__}: {exc}", "traceback": tb},
    )


app.include_router(face.router, prefix="", tags=["Face Recognition"])


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "face-recognition-service"}
