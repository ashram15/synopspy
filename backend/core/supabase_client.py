"""
Supabase client stubs.

The application previously used Supabase REST endpoints for storing and
matching document chunks. Those runtime calls are disabled so RAG-related
networking does not occur. Re-implement these helpers if/when you re-enable
the RAG pipeline.
"""

from typing import Any, Dict, List


def is_supabase_configured() -> bool:
    return False


def delete_chunks_for_upload(user_id: str, upload_id: str) -> None:
    # No-op when RAG is disabled.
    return


def insert_chunks(rows: List[Dict[str, Any]]) -> None:
    # No-op when RAG is disabled.
    return


def match_document_chunks(
    query_embedding: List[float],
    user_id: str,
    upload_id: str,
    match_count: int,
) -> List[Dict[str, Any]]:
    # Return empty hits when RAG is disabled.
    return []
