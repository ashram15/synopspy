from fastapi.testclient import TestClient
from backend import app as app_module

client = TestClient(app_module.app)


def test_read_main():
    response = client.get("/")
    assert response.status_code in [200, 404]


def test_chat_requires_feature_flag(monkeypatch):
    monkeypatch.setattr(app_module, "RAG_ENABLED", False)
    app_module.app.dependency_overrides[app_module.get_current_user] = lambda: {"sub": "user_123"}
    response = client.post("/uploads/fake-upload-id/chat", json={"question": "What is this document about?"})
    assert response.status_code == 503
    app_module.app.dependency_overrides = {}


def test_chat_empty_question_validation(monkeypatch):
    monkeypatch.setattr(app_module, "RAG_ENABLED", True)
    app_module.app.dependency_overrides[app_module.get_current_user] = lambda: {"sub": "user_123"}

    response = client.post("/uploads/fake-upload-id/chat", json={"question": "   "})

    assert response.status_code == 400
    assert response.json()["detail"] == "Question cannot be empty."
    app_module.app.dependency_overrides = {}
