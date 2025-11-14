import json
import time
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi import FastAPI, UploadFile, File, APIRouter, Depends, HTTPException
from typing import Optional
from db import db  # Import the database connection
from io import BytesIO
from datetime import datetime
from jose import jwt  # For JWT token handling
import fitz  # PyMuPDF for PDF processing
from dotenv import load_dotenv
import os
import requests
from google import genai
from docx import Document  # python-docx for DOCX processing


load_dotenv()  # Load environment variables from .env file
API_KEY = os.getenv("GEMENI_API_KEY")

auth_scheme = HTTPBearer()
AUTH_0_DOMAIN = os.getenv("AUTH_0_DOMAIN")
API_AUDIENCE = os.getenv("AUTH_0_AUDIENCE")
ALGORITHMS = ["RS256"]


app = FastAPI()
router = APIRouter()

# Allow CORS for origin {FRONTEND_URL}
# Because frontend and backend are running on different ports
# EXTRA INFORMATION:
# CORS (Cross-Origin Resource Sharing) is a mechanism that allows restricted resources on a web
# This is necessary for the frontend to be able to make requests to the backend
# This is a security feature to prevent cross-origin requests
# In production, you should restrict this to specific origins
# You can also use a wildcard '*' to allow all origins, but it's not recommended for production
# MAKE SURE TO RESTRICT CORS IN PRODUCTION/DEPLOYMENT (change allow_origins to specific website domain)
FRONTEND_URL = os.getenv("FRONTEND_URL")
app.add_middleware(
    CORSMiddleware,
    # Allow requests from the frontend URL
    allow_origins=["https://synopspy.onrender.com", FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_current_user(token: str = Depends(auth_scheme)):
    try:
        # Get JWKS token from Auth0
        jwks_url = f"https://{AUTH_0_DOMAIN}/.well-known/jwks.json"
        jwks = requests.get(jwks_url).json()
        unverified_header = jwt.get_unverified_header(token.credentials)
        rsa_key = {}
        for key in jwks["keys"]:
            if key["kid"] == unverified_header["kid"]:
                rsa_key = {
                    "kty": key["kty"],
                    "kid": key["kid"],
                    "use": key["use"],
                    "n": key["n"],
                    "e": key["e"]
                }
        if not rsa_key:
            raise HTTPException(status_code=401, detail="Invalid token")

        payload = jwt.decode(token.credentials, rsa_key, algorithms=ALGORITHMS,
                             audience=API_AUDIENCE, issuer=f"https://{AUTH_0_DOMAIN}/")
        return payload
    except Exception:
        raise HTTPException(status_code=401, detail="Token Validation Failed")


def get_current_user_optional(token: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))):
    """Get current user if authenticated, return None if not"""
    if token is None:
        return None

    try:
        # Get JWKS token from Auth0
        jwks_url = f"https://{AUTH_0_DOMAIN}/.well-known/jwks.json"
        jwks = requests.get(jwks_url).json()
        unverified_header = jwt.get_unverified_header(token.credentials)
        rsa_key = {}
        for key in jwks["keys"]:
            if key["kid"] == unverified_header["kid"]:
                rsa_key = {
                    "kty": key["kty"],
                    "kid": key["kid"],
                    "use": key["use"],
                    "n": key["n"],
                    "e": key["e"]
                }
        if not rsa_key:
            return None

        payload = jwt.decode(token.credentials, rsa_key, algorithms=ALGORITHMS,
                             audience=API_AUDIENCE, issuer=f"https://{AUTH_0_DOMAIN}/")
        return payload
    except Exception:
        return None


def extract_text_from_pdf_bytes(pdf_bytes):
    text = ""
    try:
        with fitz.open(stream=pdf_bytes, filename="pdf") as doc:
            for page in doc:
                text += page.get_text()
    except Exception as e:
        print(f"Error extracting text from PDF: {e}")
    return text


def extract_text_from_doc_bytes(docx_bytes):
    text = ""
    try:
        doc = Document(BytesIO(docx_bytes))
        for para in doc.paragraphs:
            text += para.text + "\n"
    except Exception as e:
        print(f"Error extracting text from DOCX: {e}")
    return text


def handleFile(filetext):
    txt_file = "file.txt"
    with open(txt_file, "w") as f:
        f.write(filetext)

    # The client gets the API key from the environment variable `GEMINI_API_KEY`.
    client = genai.Client(api_key=API_KEY)

    # Retry logic for API calls
    max_retries = 3
    retry_delay = 2  # seconds

    for attempt in range(max_retries):
        try:
            myfile = client.files.upload(file="file.txt")

            response = client.models.generate_content(
                model="gemini-2.5-flash", contents=[myfile, "\nTell me the topic of the file.",
                                                    "Summarize the file content in 3 sentences.",
                                                    "If the topic of the file is an important document (like a legal document, contract, or terms and conditions), "
                                                    "rate its security level on a scale of 1 to 5 (1 being safe document, 5 being highly sensitive document). "
                                                    "Advise the user what to do if they encounter this. In addition to the rating, flag any concerning language or phrases that indicate potential security risks. Answer this concerning language in an array of strings. Keep this concise and to the point.",
                                                    "Respond ONLY as JSON.The format should be like {"
                                                    "'topic': 'text', 'summary':'text','security_level':'number on scale with description of level', 'concerning_language':'text', 'questions': 'questions the user should ask regarding the document. Answer this in a array of strings. Keep these questions concise.'Do not include any other text.",
                                                    "Also keep the response short and concise."
                                                    ],
            )

            try:
                cleaned = response.text.strip("```json").strip("```").strip()
                parsed = json.loads(cleaned)
                return parsed

            except json.JSONDecodeError as e:
                print("JSON Decode Error:", e)
                print("Raw response:", response.text)
                return {"error": f"JSON parsing failed: {str(e)}", "raw": response.text}

        except Exception as e:
            print(f"API call attempt {attempt + 1} failed: {str(e)}")
            if "503" in str(e) or "overloaded" in str(e).lower():
                if attempt < max_retries - 1:
                    print(f"Retrying in {retry_delay} seconds...")
                    time.sleep(retry_delay)
                    retry_delay *= 2  # Exponential backoff
                    continue
                else:
                    return {"error": "503 UNAVAILABLE. The AI service is currently overloaded. Please try again later."}
            else:
                return {"error": f"API call failed: {str(e)}"}

    return {"error": "Maximum retries exceeded"}


@app.post("/upload")
async def upload_file(file: UploadFile = File(...), user: Optional[dict] = Depends(get_current_user_optional)):
    if user:
        print("User payload:", user)
    else:
        print("Anonymous upload")

    try:
        contents = await file.read()

        # Process file contents based on file type
        # Save file contents to a temporary file
        # with open(file.filename, "wb") as f:
        #     f.write(contents)
        if file.content_type == "application/pdf":
            text = extract_text_from_pdf_bytes(contents)
            # return {"filename": file.filename, "text": text, "content_type": file.content_type}
        elif file.content_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
            text = extract_text_from_doc_bytes(contents)
        else:
            return {"error": "Unsupported file type"}

        #  # delete the file after processing
        # import os
        # os.remove(file.filename)

        analysis_result = handleFile(text)

        # Save analysis + metadata to MongoDB only if user is authenticated
        if user:
            await db.uploads.insert_one({
                "filename": file.filename,
                "content_type": file.content_type,
                # Replace with actual user ID if available
                "user_id": user["sub"],
                "analysis": analysis_result,
                "timestamp": datetime.utcnow()
            })

        # Return the analysis
        # return {
        #     "file_url": public_url,
        #     "analysis": analysis_result
        # }
        return analysis_result
    except Exception as e:
        return {"error": str(e)}

print("Received file:")


@app.get("/uploads")
async def get_uploads(user: dict = Depends(get_current_user)):
    uploads = await db.uploads.find({"user_id": user["sub"]}).to_list(100)

    # Convert ObjectId to string for JSON serialization
    for upload in uploads:
        upload["_id"] = str(upload["_id"])

    return uploads
