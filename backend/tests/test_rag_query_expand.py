from services.rag_engine import _expand_search_query, NOT_FOUND_REPLY


def test_expand_module_query():
    q = _expand_search_query("what does module 2 include?")
    assert "MODULE 2" in q
    assert "MODULE 02" in q


def test_not_found_reply_is_document_scoped():
    assert "contract" not in NOT_FOUND_REPLY.lower()
