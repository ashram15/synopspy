from bson import ObjectId
from fastapi.testclient import TestClient
from backend import app as app_module

client = TestClient(app_module.app)


class _FakeUploads:
    def __init__(self, cached=None):
        self.cached = cached
        self.find_queries = []
        self.updates = []
        self.inserts = []

    async def find_one(self, query, *args, **kwargs):
        self.find_queries.append(query)
        return self.cached

    async def update_one(self, query, update, *args, **kwargs):
        self.updates.append((query, update))
        return None

    async def insert_one(self, doc, *args, **kwargs):
        self.inserts.append(doc)

        class _Result:
            inserted_id = ObjectId()

        return _Result()

    async def create_index(self, *args, **kwargs):
        return "user_id_content_hash"


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


def test_ensure_rag_requires_feature_flag(monkeypatch):
    monkeypatch.setattr(app_module, "RAG_ENABLED", False)
    app_module.app.dependency_overrides[app_module.get_current_user] = lambda: {"sub": "user_123"}
    response = client.post("/uploads/aaaaaaaaaaaaaaaaaaaaaaaa/ensure-rag")
    assert response.status_code == 503
    app_module.app.dependency_overrides = {}


def test_upload_cache_hit_skips_gemini(monkeypatch):
    cached_id = ObjectId()
    cached = {
        "_id": cached_id,
        "user_id": "user_123",
        "content_hash": "ignored",
        "analysis": {
            "topic": "Cached Topic",
            "summary": "Cached summary",
            "security_level": "1 safe",
            "concerning_language": [],
            "questions": ["What is this?"],
        },
        "rag_status": "ready",
        "rag_chunks": 4,
        "extracted_text": "hello world",
    }
    fake_uploads = _FakeUploads(cached=cached)

    class _FakeDb:
        uploads = fake_uploads

    called = {"handleFile": False}

    def _fail_handle_file(_text):
        called["handleFile"] = True
        raise AssertionError("Gemini handleFile must not run on cache hit")

    monkeypatch.setattr(app_module, "db", _FakeDb())
    monkeypatch.setattr(app_module, "RAG_ENABLED", True)
    monkeypatch.setattr(app_module, "handleFile", _fail_handle_file)
    app_module.app.dependency_overrides[app_module.get_current_user_optional] = (
        lambda: {"sub": "user_123"}
    )

    response = client.post(
        "/upload",
        files={"file": ("contract.pdf", b"%PDF-1.4 cached-bytes", "application/pdf")},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["cache_hit"] is True
    assert body["upload_id"] == str(cached_id)
    assert body["topic"] == "Cached Topic"
    assert body["rag_status"] == "ready"
    assert called["handleFile"] is False
    assert fake_uploads.find_queries
    assert fake_uploads.find_queries[0]["user_id"] == "user_123"
    assert "content_hash" in fake_uploads.find_queries[0]
    assert fake_uploads.updates
    assert fake_uploads.inserts == []
    app_module.app.dependency_overrides = {}


def test_content_hash_is_stable():
    assert app_module._content_hash(b"abc") == app_module._content_hash(b"abc")
    assert app_module._content_hash(b"abc") != app_module._content_hash(b"abd")
