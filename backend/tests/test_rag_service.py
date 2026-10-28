from services import rag_service


def test_ingest_document_zero_chunks_is_failure(monkeypatch):
    monkeypatch.setattr(
        rag_service,
        "embed_and_store",
        lambda **kwargs: {"document_id": "u1", "chunks_stored": 0},
    )

    result = rag_service.ingest_document(
        user_id="user",
        upload_id="u1",
        filename="doc.pdf",
        text="some text",
    )

    assert result["ingested"] is False
    assert result["chunks_stored"] == 0
    assert "No chunks" in result["reason"]


def test_ingest_document_success(monkeypatch):
    monkeypatch.setattr(
        rag_service,
        "embed_and_store",
        lambda **kwargs: {
            "document_id": "u1",
            "document_name": "doc.pdf",
            "chunks_stored": 3,
        },
    )

    result = rag_service.ingest_document(
        user_id="user",
        upload_id="u1",
        filename="doc.pdf",
        text="some text",
    )

    assert result["ingested"] is True
    assert result["chunks_stored"] == 3


def test_vectors_ready_for_upload(monkeypatch):
    monkeypatch.setattr(rag_service, "document_vector_count", lambda _id: 5)
    assert rag_service.vectors_ready_for_upload("u1") == {
        "ready": True,
        "rag_chunks": 5,
    }

    monkeypatch.setattr(rag_service, "document_vector_count", lambda _id: 0)
    assert rag_service.vectors_ready_for_upload("u1")["ready"] is False


def test_answer_document_question_passes_top_k(monkeypatch):
    captured = {}

    def fake_query_contract(**kwargs):
        captured.update(kwargs)
        return "ok"

    monkeypatch.setattr(rag_service, "query_contract", fake_query_contract)
    monkeypatch.setattr(rag_service, "RAG_TOP_K", 8)

    answer = rag_service.answer_document_question("user", "u1", "What is this?")

    assert answer["answer"] == "ok"
    assert captured["top_k"] == 8
