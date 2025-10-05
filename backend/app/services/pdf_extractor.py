from PyPDF2 import PdfReader
from typing import Tuple
from io import BytesIO

class PDFPageLimitError(Exception):
    pass

def extract_text_and_validate(data: bytes, max_pages: int) -> Tuple[str, int]:
    reader = PdfReader(BytesIO(data))
    page_count = len(reader.pages)
    if page_count > max_pages:
        raise PDFPageLimitError(f"PDF has {page_count} pages which exceeds limit {max_pages}")
    texts = []
    for page in reader.pages:
        try:
            t = page.extract_text() or ""
        except Exception:
            t = ""
        texts.append(t)
    combined = "\n".join(texts)
    return combined, page_count
