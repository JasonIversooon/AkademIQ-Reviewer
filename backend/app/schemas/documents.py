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
    difficulty: str = "medium"  # easy | medium | hard

class FlashcardListResponse(BaseModel):
    flashcards: List[Flashcard]

class ExplanationRequest(BaseModel):
    style: str = "layman"  # layman | professor | industry

class ExplanationResponse(BaseModel):
    style: str
    content: str

class FlashcardStatusUpdate(BaseModel):
    status: str

class QuizQuestion(BaseModel):
    id: str
    question: str
    options: List[str]
    correct_answer: int  # Index of correct option (0-3)
    explanation: str

class QuizGenerationRequest(BaseModel):
    difficulty: str = "medium"  # easy | medium | hard

class QuizResponse(BaseModel):
    quiz_id: str
    difficulty: str
    questions: List[QuizQuestion]

class QuizAnswerRequest(BaseModel):
    answers: List[int]  # List of selected option indices

class QuizResultResponse(BaseModel):
    quiz_id: str
    score: int
    total_questions: int
    percentage: float
    results: List[dict]  # Question results with correct/incorrect info

class PodcastDialogueLine(BaseModel):
    speaker: int  # 1 or 2
    text: str

class PodcastGenerationRequest(BaseModel):
    voice_option: str  # "male-male", "female-female", "male-female"

class PodcastScript(BaseModel):
    id: str
    speaker1: str
    speaker2: str
    dialogue: List[PodcastDialogueLine]
    audio_url: str | None = None
