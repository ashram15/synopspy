import os
from datetime import datetime, timezone
from typing import Optional

from fastapi import FastAPI, UploadFile, File, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from core.database import db
from core.security import get_current_user, get_current_user_optional
from services.file_service import extract_text_from_pdf_bytes, extract_text_from_doc_bytes
from services.google_gemini import handleFile

from services.pdf_generator import generate_analysis_pdf
from fastapi.responses import StreamingResponse
import io


load_dotenv()

app = FastAPI()

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
)


@app.post("/upload")
async def upload_file(file: UploadFile = File(...), user: Optional[dict] = Depends(get_current_user_optional)):
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
        if user:
            await db.uploads.insert_one({
                "filename": file.filename,
                "content_type": file.content_type,
                "user_id": user["sub"],
                "analysis": analysis_result,
                "timestamp": datetime.now(timezone.utc)
            })

        return analysis_result
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Server Error: {str(e)}")
        raise HTTPException(
            status_code=500, detail="Internal Server Error processing file")


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
    user: dict = Depends(get_current_user)
):
    # Fetch the upload from MongoDB
    upload = await db.uploads.find_one({
        "_id": db.to_object_id(upload_id),
        "user_id": user["sub"]
    })

    if not upload:
        raise HTTPException(status_code=404, detail="Analysis not found")

    analysis = upload.get("analysis")
    if not analysis:
        raise HTTPException(status_code=400, detail="No analysis available")

    pdf_bytes = generate_analysis_pdf(analysis)

    filename = upload.get("filename", "analysis")

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}.pdf"'
        }
    )
