from fastapi.testclient import TestClient
from backend.app import app

client = TestClient(app)


def test_read_main():
    response = client.get("/")
    assert response.status_code in [200, 404]
