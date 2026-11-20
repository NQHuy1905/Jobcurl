"""Turn an uploaded resume file into plain text."""
import re
from io import BytesIO

from pypdf import PdfReader

MAX_UPLOAD_BYTES = 5 * 1024 * 1024
MAX_RESUME_CHARS = 30000


def extract_text(filename: str, data: bytes) -> str:
    name = (filename or "").lower()
    if name.endswith(".pdf"):
        try:
            reader = PdfReader(BytesIO(data))
            text = "\n".join((page.extract_text() or "") for page in reader.pages)
        except Exception as exc:  # encrypted / corrupt PDF
            raise ValueError(f"Could not read the PDF ({type(exc).__name__}). Paste the text instead.")
    elif name.endswith((".txt", ".md")):
        text = data.decode("utf-8", errors="replace")
    else:
        raise ValueError("Unsupported file type. Use PDF, TXT or MD, or paste the text.")

    text = re.sub(r"[ \t]+\n", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text).strip()
    if not text:
        raise ValueError("No text found in the file (scanned PDF?). Paste the text instead.")
    return text
