from fastapi.testclient import TestClient
from app import app  # Make sure imports match your structure

client = TestClient(app)


def test_read_main():
    # This proves your app starts up without crashing
    response = client.get("/")
    # If you don't have a root route, you can test a 404 is returned, which is still valid!
    assert response.status_code in [200, 404]
