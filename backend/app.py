import hashlib
import logging
import os
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Optional

from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from bson import ObjectId
from pydantic import BaseModel

from core.database import db
from core.security import get_current_user, get_current_user_optional
from services.file_service import extract_text_from_pdf_bytes, extract_text_from_doc_bytes
from services.google_gemini import handleFile
from services.rag_service import (
    ingest_document,
    answer_document_question,
    vectors_ready_for_upload,
)
from core.config import RAG_ENABLED, MAX_DOC_CHARS

from services.pdf_generator import generate_analysis_pdf
from fastapi.responses import StreamingResponse
import io


load_dotenv()

logger = logging.getLogger(__name__)


async def ensure_upload_indexes() -> None:
    """Compound index for per-user duplicate-upload cache lookups."""
    try:
        await db.uploads.create_index(
            [("user_id", 1), ("content_hash", 1)],
            name="user_id_content_hash",
        )
    except Exception as exc:
        logger.warning("Could not ensure uploads content_hash index: %s", exc)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    await ensure_upload_indexes()
    yield


app = FastAPI(lifespan=lifespan)


def _truncate_for_rag(text: str) -> str:
    if MAX_DOC_CHARS > 0 and len(text) > MAX_DOC_CHARS:
        return text[:MAX_DOC_CHARS]
    return text


def _content_hash(contents: bytes) -> str:
    return hashlib.sha256(contents).hexdigest()


def _extract_upload_text(contents: bytes, filename: Optional[str], content_type: Optional[str]) -> str:
    name = (filename or "").lower()
    if content_type == "application/pdf" or name.endswith(".pdf"):
        return extract_text_from_pdf_bytes(contents)
    if (
        content_type
        == "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        or name.endswith(".docx")
    ):
        return extract_text_from_doc_bytes(contents)
    if name.endswith(".doc"):
        raise HTTPException(
            status_code=400,
            detail="We do not support legacy .doc files. Please save your file as a modern .docx and try again.",
        )
    print(f"REJECTED: Type={content_type}, Name={filename}")
    raise HTTPException(
        status_code=400, detail="Unsupported file type. Only PDF and DOCX are allowed."
    )


def _is_supported_upload(filename: Optional[str], content_type: Optional[str]) -> bool:
    name = (filename or "").lower()
    if content_type == "application/pdf" or name.endswith(".pdf"):
        return True
    if (
        content_type
        == "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        or name.endswith(".docx")
    ):
        return True
    return False


async def _persist_rag_result(upload_id: str, result: dict) -> dict:
    ingested = bool(result.get("ingested"))
    update = {
        "rag_status": "ready" if ingested else "failed",
        "rag_chunks": int(result.get("chunks_stored") or 0),
        "rag_error": None if ingested else (result.get("reason") or "Ingest failed"),
        "rag_updated_at": datetime.now(timezone.utc),
    }
    await db.uploads.update_one(
        {"_id": ObjectId(upload_id)},
        {"$set": update},
    )
    if ingested:
        logger.info(
            "RAG ingest ready upload_id=%s chunks=%s",
            upload_id,
            update["rag_chunks"],
        )
    else:
        logger.error(
            "RAG ingest failed upload_id=%s reason=%s",
            upload_id,
            update["rag_error"],
        )
    return {
        "rag_status": update["rag_status"],
        "rag_chunks": update["rag_chunks"],
        "rag_error": update["rag_error"],
    }


def _schedule_rag_ingest(
    background_tasks: BackgroundTasks,
    user_id: str,
    upload_id: str,
    filename: str,
    text: str,
    analysis: dict,
) -> None:
    if not RAG_ENABLED:
        return

    async def _run_ingest() -> None:
        result = ingest_document(user_id, upload_id, filename, text, analysis=analysis)
        await _persist_rag_result(upload_id, result)

    background_tasks.add_task(_run_ingest)


async def _run_ingest_now(
    user_id: str,
    upload_id: str,
    filename: str,
    text: str,
    analysis: Optional[dict],
) -> dict:
    await db.uploads.update_one(
        {"_id": ObjectId(upload_id)},
        {"$set": {"rag_status": "pending", "rag_error": None}},
    )
    result = ingest_document(
        user_id,
        upload_id,
        filename,
        text,
        analysis=analysis,
    )
    return await _persist_rag_result(upload_id, result)


# Configure CORS and use env variable for frontend URL
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
ORIGINS = [
    "https://synopspy.onrender.com",
    FRONTEND_URL
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


# Custom exception handler to ensure CORS headers on errors
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers={
            "Access-Control-Allow-Origin": request.headers.get("origin", "*"),
            "Access-Control-Allow-Credentials": "true",
        }
    )


# General exception handler for all other errors
@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    print(f"Unhandled exception: {type(exc).__name__}: {str(exc)}")
    import traceback
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"},
        headers={
            "Access-Control-Allow-Origin": request.headers.get("origin", "*"),
            "Access-Control-Allow-Credentials": "true",
        }
    )


@app.post("/upload")
async def upload_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    user: Optional[dict] = Depends(get_current_user_optional),
):
    if user:
        print(f"Authenticated upload by user: {user.get('sub')}")
    else:
        print("Anonymous upload")

    try:
        contents = await file.read()
        if not contents:
            raise HTTPException(status_code=400, detail="Empty file.")

        if (file.filename or "").lower().endswith(".doc") and not (
            file.filename or ""
        ).lower().endswith(".docx"):
            raise HTTPException(
                status_code=400,
                detail="We do not support legacy .doc files. Please save your file as a modern .docx and try again.",
            )

        if not _is_supported_upload(file.filename, file.content_type):
            print(f"REJECTED: Type={file.content_type}, Name={file.filename}")
            raise HTTPException(
                status_code=400, detail="Unsupported file type. Only PDF and DOCX are allowed."
            )

        file_hash = _content_hash(contents)

        # Per-user content-hash cache: reuse prior analysis and skip Gemini.
        if user:
            cached = await db.uploads.find_one(
                {"user_id": user["sub"], "content_hash": file_hash},
            )
            if cached and cached.get("analysis"):
                upload_id = str(cached["_id"])
                now = datetime.now(timezone.utc)
                rag_status = cached.get("rag_status") or (
                    "disabled" if not RAG_ENABLED else "unknown"
                )
                update_fields = {
                    "timestamp": now,
                    "filename": file.filename,
                    "content_type": file.content_type,
                }

                needs_rag = RAG_ENABLED and not (
                    rag_status == "ready" and int(cached.get("rag_chunks") or 0) > 0
                )
                if needs_rag:
                    text_for_rag = (cached.get("extracted_text") or "").strip()
                    if not text_for_rag:
                        extracted = _extract_upload_text(
                            contents, file.filename, file.content_type
                        )
                        if not extracted.strip():
                            raise HTTPException(
                                status_code=400,
                                detail="Could not extract text from the file.",
                            )
                        text_for_rag = _truncate_for_rag(extracted)
                        update_fields["extracted_text"] = text_for_rag
                    update_fields["rag_status"] = "pending"
                    update_fields["rag_error"] = None
                    rag_status = "pending"
                    _schedule_rag_ingest(
                        background_tasks,
                        user["sub"],
                        upload_id,
                        file.filename,
                        text_for_rag,
                        cached["analysis"],
                    )
                elif not RAG_ENABLED:
                    rag_status = "disabled"

                await db.uploads.update_one(
                    {"_id": cached["_id"]},
                    {"$set": update_fields},
                )
                logger.info(
                    "Upload cache hit user_id=%s upload_id=%s hash=%s",
                    user["sub"],
                    upload_id,
                    file_hash[:12],
                )
                return {
                    **cached["analysis"],
                    "upload_id": upload_id,
                    "rag_status": rag_status,
                    "cache_hit": True,
                }

        text = _extract_upload_text(contents, file.filename, file.content_type)
        if not text.strip():
            raise HTTPException(
                status_code=400, detail="Could not extract text from the file.")

        analysis_result = handleFile(text)

        # Check for AI errors
        if "error" in analysis_result:
            raise HTTPException(
                status_code=500, detail=analysis_result["error"])

        # Save analysis + metadata to MongoDB only if user is authenticated
        upload_id = None
        rag_status = "disabled"
        if user:
            text_for_rag = _truncate_for_rag(text)
            rag_status = "pending" if RAG_ENABLED else "disabled"
            doc = {
                "filename": file.filename,
                "content_type": file.content_type,
                "user_id": user["sub"],
                "content_hash": file_hash,
                "analysis": analysis_result,
                "timestamp": datetime.now(timezone.utc),
                "rag_status": rag_status,
                "rag_chunks": 0,
                "rag_error": None,
            }
            if RAG_ENABLED:
                doc["extracted_text"] = text_for_rag
            result = await db.uploads.insert_one(doc)
            upload_id = str(result.inserted_id)
            _schedule_rag_ingest(
                background_tasks,
                user["sub"],
                upload_id,
                file.filename,
                text_for_rag,
                analysis_result,
            )

        return {
            **analysis_result,
            "upload_id": upload_id,
            "rag_status": rag_status,
            "cache_hit": False,
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Server Error: {str(e)}")
        raise HTTPException(
            status_code=500, detail="Internal Server Error processing file")


class ChatRequest(BaseModel):
    question: str


@app.get("/uploads")
async def get_uploads(user: dict = Depends(get_current_user)):
    # Omit extracted_text from list responses (can be large).
    uploads = await db.uploads.find(
        {"user_id": user["sub"]},
        {"extracted_text": 0},
    ).to_list(100)

    # Convert ObjectId to string for JSON serialization
    for upload in uploads:
        upload["_id"] = str(upload["_id"])

    return uploads


@app.get("/uploads/{upload_id}/rag-status")
async def get_rag_status(
    upload_id: str,
    user: dict = Depends(get_current_user),
):
    if not RAG_ENABLED:
        return {
            "upload_id": upload_id,
            "rag_status": "disabled",
            "rag_chunks": 0,
            "rag_error": None,
        }

    try:
        upload = await db.uploads.find_one(
            {"_id": ObjectId(upload_id), "user_id": user["sub"]},
            {"rag_status": 1, "rag_chunks": 1, "rag_error": 1},
        )
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid upload id.")

    if not upload:
        raise HTTPException(status_code=404, detail="Upload not found.")

    return {
        "upload_id": upload_id,
        "rag_status": upload.get("rag_status") or "unknown",
        "rag_chunks": upload.get("rag_chunks") or 0,
        "rag_error": upload.get("rag_error"),
    }


@app.post("/uploads/{upload_id}/ensure-rag")
async def ensure_rag_for_upload(
    upload_id: str,
    user: dict = Depends(get_current_user),
):
    """
    Ensure vectors exist for an upload (used when reopening past uploads).
    Runs ingest synchronously when status is not already ready.
    """
    if not RAG_ENABLED:
        raise HTTPException(
            status_code=503,
            detail="Document chat is disabled by configuration.",
        )

    try:
        upload = await db.uploads.find_one({
            "_id": ObjectId(upload_id),
            "user_id": user["sub"],
        })
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid upload id.")

    if not upload:
        raise HTTPException(status_code=404, detail="Upload not found.")

    if upload.get("rag_status") == "ready" and int(upload.get("rag_chunks") or 0) > 0:
        return {
            "upload_id": upload_id,
            "rag_status": "ready",
            "rag_chunks": upload.get("rag_chunks") or 0,
            "rag_error": None,
        }

    # Legacy uploads may already have vectors even when Mongo lacks rag_status /
    # extracted_text. Prefer the vector store over forcing a re-upload.
    existing = vectors_ready_for_upload(upload_id)
    if existing["ready"]:
        status = {
            "rag_status": "ready",
            "rag_chunks": existing["rag_chunks"],
            "rag_error": None,
        }
        await db.uploads.update_one(
            {"_id": ObjectId(upload_id)},
            {
                "$set": {
                    **status,
                    "rag_updated_at": datetime.now(timezone.utc),
                }
            },
        )
        logger.info(
            "Recovered RAG ready from vecs upload_id=%s chunks~=%s",
            upload_id,
            existing["rag_chunks"],
        )
        return {"upload_id": upload_id, **status}

    text = (upload.get("extracted_text") or "").strip()
    if not text:
        await db.uploads.update_one(
            {"_id": ObjectId(upload_id)},
            {
                "$set": {
                    "rag_status": "unavailable",
                    "rag_error": "No stored text for this upload. Please re-upload the file to enable chat.",
                }
            },
        )
        raise HTTPException(
            status_code=400,
            detail="This upload has no stored text for chat indexing. Please re-upload the file.",
        )

    status = await _run_ingest_now(
        user_id=user["sub"],
        upload_id=upload_id,
        filename=upload.get("filename") or "document",
        text=text,
        analysis=upload.get("analysis"),
    )
    if status["rag_status"] != "ready":
        raise HTTPException(
            status_code=500,
            detail=status.get("rag_error") or "Failed to index document for chat.",
        )
    return {"upload_id": upload_id, **status}


@app.get("/analysis/{upload_id}/pdf")
async def download_analysis_pdf(
    upload_id: str,
    # only authenticated users can download PDFs
    user: dict = Depends(get_current_user)
):
    try:
        # Fetch the upload from MongoDB
        upload = await db.uploads.find_one({
            "_id": ObjectId(upload_id),
            "user_id": user["sub"]
        })

        if not upload:
            raise HTTPException(status_code=404, detail="Analysis not found")

        analysis = upload.get("analysis")
        if not analysis:
            raise HTTPException(
                status_code=400, detail="No analysis available")

        pdf_bytes = generate_analysis_pdf(analysis)

        filename = upload.get("filename", "analysis")

        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}.pdf"'
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error generating PDF: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500, detail=f"Error generating PDF: {str(e)}")


@app.post("/uploads/{upload_id}/chat")
async def chat_about_upload(
    upload_id: str,
    payload: ChatRequest,
    user: dict = Depends(get_current_user),
):
    if not RAG_ENABLED:
        raise HTTPException(
            status_code=503,
            detail="Document chat is disabled by configuration.",
        )
    question = payload.question.strip()
    if not question:
        raise HTTPException(
            status_code=400, detail="Question cannot be empty.")

    try:
        upload = await db.uploads.find_one({
            "_id": ObjectId(upload_id),
            "user_id": user["sub"],
        })
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid upload id.")

    if not upload:
        raise HTTPException(status_code=404, detail="Upload not found.")

    rag_status = upload.get("rag_status") or "unknown"
    if rag_status == "pending":
        raise HTTPException(
            status_code=503,
            detail="Document is still being indexed for chat. Please try again shortly.",
        )
    if rag_status != "ready":
        # Recover legacy/mis-marked uploads that already have vectors in vecs.
        existing = vectors_ready_for_upload(upload_id)
        if existing["ready"]:
            await db.uploads.update_one(
                {"_id": ObjectId(upload_id)},
                {
                    "$set": {
                        "rag_status": "ready",
                        "rag_chunks": existing["rag_chunks"],
                        "rag_error": None,
                        "rag_updated_at": datetime.now(timezone.utc),
                    }
                },
            )
            rag_status = "ready"
        elif rag_status == "unavailable":
            raise HTTPException(
                status_code=400,
                detail=upload.get("rag_error")
                or "This upload cannot be used for chat. Please re-upload the file.",
            )
        elif rag_status == "failed":
            raise HTTPException(
                status_code=503,
                detail=upload.get("rag_error")
                or "Document indexing failed. Re-open the upload to retry, or re-upload the file.",
            )
        else:
            # Legacy uploads without rag_status: ingest if text exists.
            text = (upload.get("extracted_text") or "").strip()
            if text:
                status = await _run_ingest_now(
                    user_id=user["sub"],
                    upload_id=upload_id,
                    filename=upload.get("filename") or "document",
                    text=text,
                    analysis=upload.get("analysis"),
                )
                if status["rag_status"] != "ready":
                    raise HTTPException(
                        status_code=503,
                        detail=status.get("rag_error")
                        or "Document is not indexed for chat yet.",
                    )
            else:
                raise HTTPException(
                    status_code=400,
                    detail="This upload is not indexed for chat. Please re-upload the file.",
                )

    try:
        result = answer_document_question(
            user_id=user["sub"],
            upload_id=upload_id,
            question=question,
        )
        return result
    except Exception as e:
        print(f"RAG chat error: {type(e).__name__}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to answer question about this document.",
        )
