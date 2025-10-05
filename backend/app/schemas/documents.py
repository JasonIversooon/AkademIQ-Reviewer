from pydantic import BaseModel
from typing import List

class DocumentUploadResponse(BaseModel):
    document_id: str
    page_count: int

class Flashcard(BaseModel):
    id: str
    question: str
    answer: str
    status: str = "new"

class FlashcardGenerationRequest(BaseModel):
    count: int | None = 12

class FlashcardListResponse(BaseModel):
    flashcards: List[Flashcard]

class ExplanationRequest(BaseModel):
    style: str = "layman"  # layman | professor | industry

class ExplanationResponse(BaseModel):
    style: str
    content: str

class FlashcardStatusUpdate(BaseModel):
    status: str
