from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Header
from app.core.config import get_settings
from app.services.pdf_extractor import extract_text_and_validate, PDFPageLimitError
from app.schemas.documents import DocumentUploadResponse, FlashcardGenerationRequest, FlashcardListResponse, ExplanationRequest, ExplanationResponse, FlashcardStatusUpdate
from app.services import ai_client
from app.core.supabase_client import get_supabase
import uuid

router = APIRouter(prefix="/documents", tags=["documents"])


def get_user_token(authorization: str | None = Header(default=None)) -> str | None:
    if not authorization:
        return None
    if authorization.lower().startswith("bearer "):
        return authorization.split(" ", 1)[1]
    return authorization

@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(file: UploadFile = File(...), token: str | None = Depends(get_user_token)):
    settings = get_settings()
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    raw = await file.read()
    try:
        text, page_count = extract_text_and_validate(raw, settings.max_pdf_pages)
    except PDFPageLimitError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(status_code=400, detail="Failed to parse PDF")

    supabase = get_supabase()
    document_id = str(uuid.uuid4())
    # Store in a table 'documents' (create this table in Supabase)
    supabase.table("documents").insert({
        "id": document_id,
        "user_token": token,  # not ideal prod, but fine for MVP association
        "filename": file.filename,
        "page_count": page_count,
        "content": text,
    }).execute()

    return DocumentUploadResponse(document_id=document_id, page_count=page_count)

@router.post("/{document_id}/flashcards/generate", response_model=FlashcardListResponse)
async def generate_flashcards(document_id: str, req: FlashcardGenerationRequest):
    supabase = get_supabase()
    doc_resp = supabase.table("documents").select("content").eq("id", document_id).single().execute()
    if not doc_resp.data:
        raise HTTPException(status_code=404, detail="Document not found")
    text = doc_resp.data["content"]
    cards = await ai_client.generate_flashcards(text, req.count or 12)
    # store each card
    for c in cards:
        supabase.table("flashcards").insert({
            "id": c["id"],
            "document_id": document_id,
            "question": c["question"],
            "answer": c["answer"],
            "status": c["status"],
        }).execute()
    return FlashcardListResponse(flashcards=cards)

@router.get("/{document_id}/flashcards", response_model=FlashcardListResponse)
async def list_flashcards(document_id: str):
    supabase = get_supabase()
    resp = supabase.table("flashcards").select("id,question,answer,status").eq("document_id", document_id).execute()
    cards = resp.data or []
    return FlashcardListResponse(flashcards=cards)

@router.post("/{document_id}/explain", response_model=ExplanationResponse)
async def explain(document_id: str, req: ExplanationRequest):
    supabase = get_supabase()
    doc_resp = supabase.table("documents").select("content").eq("id", document_id).single().execute()
    if not doc_resp.data:
        raise HTTPException(status_code=404, detail="Document not found")
    text = doc_resp.data["content"]
    content = await ai_client.generate_explanation(text, req.style)
    # store explanation (optional caching)
    supabase.table("explanations").insert({
        "id": str(uuid.uuid4()),
        "document_id": document_id,
        "style": req.style,
        "content": content,
    }).execute()
    return ExplanationResponse(style=req.style, content=content)

@router.patch("/flashcards/{flashcard_id}", response_model=Flashcard)
async def update_flashcard_status(flashcard_id: str, body: FlashcardStatusUpdate):
    supabase = get_supabase()
    if body.status not in {"new", "mastered", "later"}:
        raise HTTPException(status_code=400, detail="Invalid status")
    resp = supabase.table("flashcards").update({"status": body.status}).eq("id", flashcard_id).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Flashcard not found")
    card = resp.data[0]
    return card
