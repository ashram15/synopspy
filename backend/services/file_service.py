import fitz  # PyMuPDF for PDF processing
from docx import Document
from io import BytesIO


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
