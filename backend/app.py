import json
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, UploadFile, File
import fitz  # PyMuPDF for PDF processing
from key import API_KEY  # Import your API key from key.py
from google import genai
from docx import Document


app = FastAPI()


# Allow CORS for origin http://localhost:5173
# Because frontend and backend are running on different ports
# EXTRA INFORMATION:
# CORS (Cross-Origin Resource Sharing) is a mechanism that allows restricted resources on a web
# This is necessary for the frontend to be able to make requests to the backend
# This is a security feature to prevent cross-origin requests
# In production, you should restrict this to specific origins
# You can also use a wildcard '*' to allow all origins, but it's not recommended for production
# MAKE SURE TO RESTRICT CORS IN PRODUCTION/DEPLOYMENT (change allow_origins to specific website domain)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def extract_text_from_pdf(pdf_path):
    text = ""
    try:
        with fitz.open(pdf_path) as doc:
            for page in doc:
                text += page.get_text()
    except Exception as e:
        print(f"Error extacting text from PDF: {e}")
    return text


def extract_text_from_doc(docx_path):
    text = ""
    try:
        doc = Document(docx_path)
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
    myfile = client.files.upload(file="file.txt")

    response = client.models.generate_content(
        model="gemini-2.5-flash", contents=[myfile, "\nTell me the topic of the file.",
                                            "Summarize the file content in 3 sentences.",
                                            "If the topic of the file is an important document (like a legal document, contract, or terms and conditions), rate its security level on a scale of 1 to 5 (1 being safe document, 5 being highly sensitive document). In addition to the rating, flag any concerning language or phrases that indicate potential security risks.",
                                            "Respond ONLY as JSON.The format should be like {"
                                            "'topic': 'text', 'summary':'text','security_level':'number on scale with description of level', 'concerning_language':'text'} Do not include any other text.",
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
        return {"error": str(e), "raw": response.text}


@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """
    Endpoint to handle file uploads.
    """
    try:
        contents = await file.read()
        # Here you can process the file contents as needed
        # For example, if it's a PDF, you can use PyMuPDF to extract text or metadata
        # Save the file temporarily to extract text
        with open(file.filename, "wb") as f:
            f.write(contents)
        if file.content_type == "application/pdf":
            text = extract_text_from_pdf(file.filename)
            # return {"filename": file.filename, "text": text, "content_type": file.content_type}
        elif file.content_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
            text = extract_text_from_doc(file.filename)

         # Optionally, you can delete the file after processing
        import os
        os.remove(file.filename)

        return handleFile(text)

    except Exception as e:
        return {"error": str(e)}

print("Received file:")
