"""
Thin API-facing wrapper around rag_engine for FastAPI routes.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, Optional

from core.config import RAG_TOP_K
from services.rag_engine import document_vector_count, embed_and_store, query_contract

logger = logging.getLogger(__name__)


def vectors_ready_for_upload(upload_id: str) -> Dict[str, Any]:
    """Check whether vecs already has chunks for this upload_id."""
    count = document_vector_count(upload_id)
    return {"ready": count > 0, "rag_chunks": count}


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
        chunks_stored = int(result.get("chunks_stored") or 0)
        if chunks_stored <= 0:
            reason = "No chunks were stored for this document."
            logger.warning(
                "ingest_document produced zero chunks user_id=%s upload_id=%s",
                user_id,
                upload_id,
            )
            return {
                "ingested": False,
                "reason": reason,
                "user_id": user_id,
                **result,
            }
        return {"ingested": True, "user_id": user_id, **result}
    except Exception as exc:
        logger.exception(
            "ingest_document failed user_id=%s upload_id=%s: %s",
            user_id,
            upload_id,
            exc,
        )
        return {"ingested": False, "reason": str(exc), "chunks_stored": 0}


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
            top_k=RAG_TOP_K,
        )
        return {"answer": answer, "upload_id": upload_id}
    except Exception as exc:
        logger.exception(
            "answer_document_question failed upload_id=%s: %s",
            upload_id,
            exc,
        )
        raise
