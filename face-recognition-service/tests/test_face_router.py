import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_verify_face_no_image():
    response = client.post("/verify-face")
    assert response.status_code == 422  # Missing required part


def test_register_face_no_image():
    response = client.post("/register-face", data={"employee_id": "test-id"})
    assert response.status_code == 422  # Missing required file
