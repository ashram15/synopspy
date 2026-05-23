"""
SynopSpy RAG engine — Google Gemini embeddings + chat, Supabase vecs (pgvector).

No LangChain / LlamaIndex / OpenAI — uses google-genai + vecs only.
"""

from __future__ import annotations

import logging
import os
import re
from typing import Any, List, Optional, Sequence, Tuple

import vecs
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

logger = logging.getLogger(__name__)

COLLECTION_NAME = os.getenv("RAG_COLLECTION_NAME", "contract_documents")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "gemini-embedding-001")
EMBEDDING_DIMENSION = int(os.getenv("EMBEDDING_DIMENSION", "768"))
CHAT_MODEL = os.getenv("CHAT_MODEL", "gemini-2.5-flash")
RAG_TOP_K = int(os.getenv("RAG_TOP_K", "8"))

NOT_FOUND_REPLY = "I cannot find this in the document."

VectorRecord = Tuple[str, List[float], dict[str, Any]]

_genai_client: Optional[genai.Client] = None
_vecs_client: Any = None
_contract_collection: Any = None


def _get_genai_client() -> genai.Client:
    global _genai_client
    if _genai_client is None:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY is not configured")
        _genai_client = genai.Client(api_key=api_key)
    return _genai_client


def _get_contract_collection():
    global _vecs_client, _contract_collection
    if _contract_collection is None:
        conn = os.getenv("SUPABASE_DB_CONNECTION_STRING")
        if not conn:
            raise RuntimeError("SUPABASE_DB_CONNECTION_STRING is not configured")
        _vecs_client = vecs.create_client(conn)
        _contract_collection = _vecs_client.get_or_create_collection(
            name=COLLECTION_NAME,
            dimension=EMBEDDING_DIMENSION,
        )
    return _contract_collection


def chunk_document(
    text: str,
    chunk_size: int = 1000,
    chunk_overlap: int = 150,
) -> list[str]:
    """
    Split document text with a character-based sliding window snapped to word
    boundaries so legal phrases are not cut mid-word.
    """
    if not text or not text.strip():
        return []

    normalized = " ".join(text.split())
    if len(normalized) <= chunk_size:
        return [normalized]

    if chunk_overlap >= chunk_size:
        raise ValueError("chunk_overlap must be smaller than chunk_size")

    chunks: list[str] = []
    start = 0
    text_len = len(normalized)

    while start < text_len:
        end = min(start + chunk_size, text_len)

        if end < text_len:
            space_idx = normalized.rfind(" ", start, end)
            if space_idx > start:
                end = space_idx

        piece = normalized[start:end].strip()
        if piece:
            chunks.append(piece)

        if end >= text_len:
            break

        next_start = end - chunk_overlap
        if next_start <= start:
            next_start = end

        while next_start < text_len and normalized[next_start] == " ":
            next_start += 1

        if next_start < text_len and next_start > 0 and normalized[next_start - 1] != " ":
            forward_space = normalized.find(" ", next_start)
            if forward_space != -1:
                next_start = forward_space + 1
                while next_start < text_len and normalized[next_start] == " ":
                    next_start += 1

        start = next_start

    return chunks


def _embed_config(task_type: str) -> types.EmbedContentConfig:
    return types.EmbedContentConfig(
        output_dimensionality=EMBEDDING_DIMENSION,
        task_type=task_type,
    )


def _embed_texts(texts: Sequence[str], *, task_type: str = "RETRIEVAL_DOCUMENT") -> List[List[float]]:
    """Batch-embed texts with Gemini (gemini-embedding-001 by default)."""
    if not texts:
        return []

    try:
        response = _get_genai_client().models.embed_content(
            model=EMBEDDING_MODEL,
            contents=list(texts),
            config=_embed_config(task_type),
        )
        embeddings: list[list[float]] = []
        for item in response.embeddings:
            values = list(item.values)
            if len(values) != EMBEDDING_DIMENSION:
                raise ValueError(
                    f"Expected {EMBEDDING_DIMENSION}-dim embedding, got {len(values)}"
                )
            embeddings.append(values)
        if len(embeddings) != len(texts):
            raise ValueError(
                f"Embedding count mismatch: got {len(embeddings)} for {len(texts)} inputs"
            )
        return embeddings
    except Exception as exc:
        logger.exception("Gemini embedding request failed: %s", exc)
        raise


def _chunk_id(document_id: str, chunk_index: int) -> str:
    return f"{document_id}::{chunk_index}"


def _expand_search_query(user_query: str) -> str:
    """Add literal variants (e.g. MODULE 02) so embeddings match slide-style headings."""
    expanded = user_query.strip()
    module_match = re.search(r"\bmodule\s*#?\s*(\d+)\b", expanded, re.IGNORECASE)
    if module_match:
        num = module_match.group(1)
        padded = num.zfill(2)
        expanded += f" MODULE {num} MODULE {padded} MODULE {num.zfill(2)}"
    return expanded


def _build_supplemental_chunks(analysis: Optional[dict[str, Any]]) -> list[str]:
    """Turn upload analysis into extra searchable chunks for sparse PDFs."""
    if not analysis:
        return []
    parts: list[str] = []
    topic = (analysis.get("topic") or "").strip()
    summary = (analysis.get("summary") or "").strip()
    if topic:
        parts.append(f"Document topic: {topic}")
    if summary:
        parts.append(f"Document summary: {summary}")
    questions = analysis.get("questions")
    if isinstance(questions, list) and questions:
        parts.append("Suggested questions:\n" + "\n".join(f"- {q}" for q in questions[:12]))
    return parts


def embed_and_store(
    document_id: str,
    document_name: str,
    raw_text: str,
    analysis: Optional[dict[str, Any]] = None,
) -> dict[str, Any]:
    """
    Chunk a document, embed each chunk, upsert into vecs, and refresh the index.
    """
    if not document_id or not document_id.strip():
        raise ValueError("document_id is required")
    if not raw_text or not raw_text.strip():
        logger.info("embed_and_store skipped: empty raw_text for document_id=%s", document_id)
        return {"document_id": document_id, "chunks_stored": 0}

    try:
        chunks = chunk_document(raw_text)
        for extra in _build_supplemental_chunks(analysis):
            if extra.strip():
                chunks.append(extra)
        if not chunks:
            logger.warning("No chunks produced for document_id=%s", document_id)
            return {"document_id": document_id, "chunks_stored": 0}

        logger.info(
            "Embedding %d chunk(s) for document_id=%s (%s) via %s",
            len(chunks),
            document_id,
            document_name,
            EMBEDDING_MODEL,
        )

        embeddings = _embed_texts(chunks, task_type="RETRIEVAL_DOCUMENT")

        vectors: list[VectorRecord] = []
        for idx, (chunk_text, embedding) in enumerate(zip(chunks, embeddings)):
            vectors.append(
                (
                    _chunk_id(document_id, idx),
                    embedding,
                    {
                        "document_id": document_id,
                        "document_name": document_name,
                        "raw_text": chunk_text,
                    },
                )
            )

        try:
            _get_contract_collection().delete(
                filters={"document_id": {"$eq": document_id}},
            )
        except Exception as exc:
            logger.warning(
                "Could not delete prior chunks for document_id=%s (continuing): %s",
                document_id,
                exc,
            )

        _get_contract_collection().upsert(records=vectors)
        logger.info("Upserted %d vector(s) for document_id=%s", len(vectors), document_id)

        try:
            _get_contract_collection().create_index()
            logger.info("Index created/updated on collection '%s'", COLLECTION_NAME)
        except Exception as exc:
            logger.warning(
                "create_index on '%s' failed (search may still work): %s",
                COLLECTION_NAME,
                exc,
            )

        return {
            "document_id": document_id,
            "document_name": document_name,
            "chunks_stored": len(vectors),
        }

    except Exception as exc:
        logger.exception(
            "embed_and_store failed for document_id=%s: %s",
            document_id,
            exc,
        )
        raise


def _extract_metadata_from_query_row(row: Any) -> Optional[dict[str, Any]]:
    """Normalize vecs query row shapes into a metadata dict."""
    if row is None:
        return None

    if isinstance(row, dict):
        return row.get("metadata") or row

    if hasattr(row, "_mapping"):
        mapping = row._mapping
        if "metadata" in mapping:
            return mapping["metadata"]
        return dict(mapping)

    if isinstance(row, (list, tuple)):
        if len(row) >= 2:
            candidate = row[-1]
            if isinstance(candidate, dict):
                return candidate
        if len(row) == 1 and isinstance(row[0], dict):
            return row[0]

    return None


def _build_context_from_matches(matches: Sequence[Any]) -> str:
    """Join raw_text fields from query matches into a single context block."""
    blocks: list[str] = []
    seen: set[str] = set()

    for row in matches:
        metadata = _extract_metadata_from_query_row(row)
        if not metadata:
            continue
        raw = (metadata.get("raw_text") or "").strip()
        if not raw or raw in seen:
            continue
        seen.add(raw)
        blocks.append(raw)

    if not blocks:
        return ""

    parts = []
    for i, block in enumerate(blocks, start=1):
        parts.append(f"--- Context Block {i} ---\n{block}")
    return "\n\n".join(parts)


def _document_qa_prompt(context: str) -> str:
    return (
        "You are a document assistant for SynopSpy. Answer the user's question using "
        "ONLY the document context blocks below (training slides, contracts, policies, etc.). "
        "Treat headings like MODULE 02, Module 2, and Chapter 2 as the same when matching. "
        "Do not use outside knowledge. "
        f"If the answer is not supported by the context, respond exactly with: \"{NOT_FOUND_REPLY}\" "
        "Be concise and precise. Use bullet points for lists of topics.\n\n"
        f"DOCUMENT CONTEXT:\n{context}"
    )


def query_contract(document_id: str, user_query: str, top_k: int = 4) -> str:
    """
    Retrieve document-scoped context via vector search, then answer with Gemini.
    """
    if not document_id or not document_id.strip():
        raise ValueError("document_id is required")
    if not user_query or not user_query.strip():
        raise ValueError("user_query is required")

    query_text = user_query.strip()

    try:
        search_query = _expand_search_query(query_text)
        query_embedding = _embed_texts([search_query], task_type="RETRIEVAL_QUERY")[0]

        effective_top_k = top_k if top_k > 0 else RAG_TOP_K
        matches = _get_contract_collection().query(
            data=query_embedding,
            limit=effective_top_k,
            filters={"document_id": {"$eq": document_id}},
            include_metadata=True,
            include_value=False,
        )

        context = _build_context_from_matches(matches or [])

        if not context.strip():
            logger.info(
                "No context retrieved for document_id=%s; returning fallback answer",
                document_id,
            )
            return NOT_FOUND_REPLY

        prompt = (
            f"{_document_qa_prompt(context)}\n\n"
            f"USER QUESTION:\n{query_text}"
        )

        try:
            response = _get_genai_client().models.generate_content(
                model=CHAT_MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(temperature=0.0),
            )
            answer = (response.text or "").strip()
            if not answer:
                return NOT_FOUND_REPLY
            return answer

        except Exception as exc:
            logger.exception("Gemini chat completion failed: %s", exc)
            raise

    except Exception as exc:
        logger.exception(
            "query_contract failed for document_id=%s: %s",
            document_id,
            exc,
        )
        raise


def ingest_contract(
    document_id: str,
    document_name: str,
    raw_text: str,
) -> dict[str, Any]:
    """Convenience alias used by the API layer."""
    return embed_and_store(document_id, document_name, raw_text)
