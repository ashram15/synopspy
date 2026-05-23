from services.rag_engine import chunk_document


def test_chunk_document_empty():
    assert chunk_document("") == []
    assert chunk_document("   ") == []


def test_chunk_document_short_text():
    text = "Payment is due within thirty days."
    assert chunk_document(text) == [text]


def test_chunk_document_word_boundaries():
    words = ["word"] * 200
    text = " ".join(words)
    chunks = chunk_document(text, chunk_size=50, chunk_overlap=10)
    assert len(chunks) > 1
    for chunk in chunks:
        assert " " not in chunk or chunk == chunk.strip()
        assert not chunk.startswith(" ")
        assert not chunk.endswith(" ")
