"""
RAG configuration helpers.

Document vectors are stored via ``services.rag_engine`` using the official
``vecs`` client and ``SUPABASE_DB_CONNECTION_STRING``. There is no REST-based
``document_chunks`` path at runtime.
"""

from core.config import RAG_ENABLED, SUPABASE_DB_CONNECTION_STRING


def is_rag_store_configured() -> bool:
    """True when RAG is enabled and a Postgres connection string is set for vecs."""
    return bool(RAG_ENABLED and SUPABASE_DB_CONNECTION_STRING.strip())
