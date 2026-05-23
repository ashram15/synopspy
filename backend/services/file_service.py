import fitz  # PyMuPDF for PDF processing
from docx import Document
from io import BytesIO


def extract_text_from_pdf_bytes(pdf_bytes):
    """Extract text from PDF pages, preferring block order for slide-style layouts."""
    parts: list[str] = []
    try:
        with fitz.open(stream=pdf_bytes, filename="pdf") as doc:
            for page in doc:
                block_text = page.get_text("blocks")
                page_lines: list[str] = []
                if block_text:
                    for block in block_text:
                        if len(block) >= 5 and block[6] == 0:
                            line = (block[4] or "").strip()
                            if line:
                                page_lines.append(line)
                if page_lines:
                    parts.append("\n".join(page_lines))
                else:
                    sorted_text = page.get_text(sort=True).strip()
                    if sorted_text:
                        parts.append(sorted_text)
    except Exception as e:
        print(f"Error extracting text from PDF: {e}")
    return "\n\n".join(parts)


def extract_text_from_doc_bytes(docx_bytes):
    text = ""
    try:
        doc = Document(BytesIO(docx_bytes))
        for para in doc.paragraphs:
            text += para.text + "\n"
    except Exception as e:
        print(f"Error extracting text from DOCX: {e}")
    return text
