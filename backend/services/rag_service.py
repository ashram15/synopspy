"""
Thin API-facing wrapper around rag_engine for FastAPI routes.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, Optional

from services.rag_engine import embed_and_store, query_contract

logger = logging.getLogger(__name__)


def ingest_document(
    user_id: str,
    upload_id: str,
    filename: str,
    text: str,
    analysis: Optional[dict] = None,
) -> Dict[str, Any]:
    """
    Ingest an uploaded document into the vecs contract_documents collection.
    upload_id is used as document_id for per-upload isolation at query time.
    """
    try:
        result = embed_and_store(
            document_id=upload_id,
            document_name=filename,
            raw_text=text,
            analysis=analysis,
        )
        return {"ingested": True, "user_id": user_id, **result}
    except Exception as exc:
        logger.exception(
            "ingest_document failed user_id=%s upload_id=%s: %s",
            user_id,
            upload_id,
            exc,
        )
        return {"ingested": False, "reason": str(exc)}


def answer_document_question(
    user_id: str,
    upload_id: str,
    question: str,
) -> Dict[str, Any]:
    """Answer a question scoped to a single uploaded document."""
    _ = user_id  # reserved for future per-user isolation in metadata
    try:
        answer = query_contract(
            document_id=upload_id,
            user_query=question,
        )
        return {"answer": answer, "upload_id": upload_id}
    except Exception as exc:
        logger.exception(
            "answer_document_question failed upload_id=%s: %s",
            upload_id,
            exc,
        )
        raise
