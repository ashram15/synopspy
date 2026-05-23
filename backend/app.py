import os
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
from services.rag_service import ingest_document, answer_document_question
from core.config import RAG_ENABLED

from services.pdf_generator import generate_analysis_pdf
from fastapi.responses import StreamingResponse
import io


load_dotenv()

app = FastAPI()


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

    def _run_ingest() -> None:
        ingest_document(user_id, upload_id, filename, text, analysis=analysis)

    background_tasks.add_task(_run_ingest)


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
        text = ""

        if file.content_type == "application/pdf":
            text = extract_text_from_pdf_bytes(contents)
        elif file.content_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document" or file.filename.lower().endswith(".docx"):
            text = extract_text_from_doc_bytes(contents)
        elif file.filename.lower().endswith(".doc"):
            raise HTTPException(
                status_code=400,
                detail="We do not support legacy .doc files. Please save your file as a modern .docx and try again."
            )
        else:
            print(f"REJECTED: Type={file.content_type}, Name={file.filename}")
            raise HTTPException(
                status_code=400, detail="Unsupported file type. Only PDF and DOCX are allowed.")

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
        if user:
            result = await db.uploads.insert_one({
                "filename": file.filename,
                "content_type": file.content_type,
                "user_id": user["sub"],
                "analysis": analysis_result,
                "timestamp": datetime.now(timezone.utc)
            })
            upload_id = str(result.inserted_id)
            _schedule_rag_ingest(
                background_tasks,
                user["sub"],
                upload_id,
                file.filename,
                text,
                analysis_result,
            )

        return {
            **analysis_result,
            "upload_id": upload_id
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
    uploads = await db.uploads.find({"user_id": user["sub"]}).to_list(100)

    # Convert ObjectId to string for JSON serialization
    for upload in uploads:
        upload["_id"] = str(upload["_id"])

    return uploads


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
