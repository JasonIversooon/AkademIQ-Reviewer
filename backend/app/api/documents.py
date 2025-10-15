from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Header
from fastapi.responses import Response
from app.core.config import get_settings
from app.services.pdf_extractor import extract_text_and_validate, PDFPageLimitError
from app.schemas.documents import (
    DocumentUploadResponse,
    Flashcard,
    FlashcardGenerationRequest,
    FlashcardListResponse,
    ExplanationRequest,
    ExplanationResponse,
    FlashcardStatusUpdate,
    QuizQuestion,
    QuizGenerationRequest,
    QuizResponse,
    QuizAnswerRequest,
    QuizResultResponse,
    PodcastGenerationRequest,
    PodcastScript,
    PodcastDialogueLine,
)
from app.services import ai_client
from app.core.supabase_client import get_supabase
import uuid
import base64

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
    
    # Store both text content and PDF file (as base64)
    pdf_base64 = base64.b64encode(raw).decode('utf-8')
    
    # Prepare data with optional fields for backward compatibility
    document_data = {
        "id": document_id,
        "user_token": token,  # not ideal prod, but fine for MVP association
        "filename": file.filename,
        "page_count": page_count,
        "content": text,
    }
    
    # Try to add new fields if they exist in the schema
    try:
        document_data.update({
            "pdf_data": pdf_base64,
            "file_size": len(raw),
            "last_accessed": "now()",
            "is_active": True
        })
    except:
        pass  # Fields don't exist yet, continue with basic data
    
    # Store in a table 'documents' (create this table in Supabase)
    try:
        supabase.table("documents").insert(document_data).execute()
    except Exception as e:
        # If new columns don't exist, try with basic data only
        if "could not find" in str(e).lower() and "column" in str(e).lower():
            basic_data = {
                "id": document_id,
                "user_token": token,
                "filename": file.filename,
                "page_count": page_count,
                "content": text,
            }
            supabase.table("documents").insert(basic_data).execute()
        else:
            raise e

    return DocumentUploadResponse(document_id=document_id, page_count=page_count)

@router.get("/list")
async def list_user_documents(token: str | None = Depends(get_user_token)):
    """List all documents for the current user"""
    if not token:
        return {"documents": []}
    
    supabase = get_supabase()
    try:
        # Try to query with is_active filter if column exists
        try:
            docs_resp = supabase.table("documents")\
                .select("id, filename, page_count, file_size, created_at")\
                .eq("user_token", token)\
                .eq("is_active", True)\
                .order("created_at", desc=True)\
                .execute()
        except:
            # Fallback if is_active column doesn't exist
            docs_resp = supabase.table("documents")\
                .select("id, filename, page_count, created_at")\
                .eq("user_token", token)\
                .order("created_at", desc=True)\
                .execute()
        
        documents = []
        for doc in docs_resp.data:
            documents.append({
                "id": doc["id"],
                "filename": doc["filename"],
                "pages": doc["page_count"],
                "size": doc.get("file_size", 0),
                "upload_date": doc.get("created_at", "Unknown"),
                "status": "processed"
            })
        
        return {"documents": documents}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list documents: {str(e)}")

@router.post("/cleanup")
async def cleanup_old_documents():
    """Cleanup documents older than 7 days (run periodically)"""
    supabase = get_supabase()
    
    try:
        # Calculate 7 days ago
        from datetime import datetime, timedelta
        seven_days_ago = datetime.now() - timedelta(days=7)
        seven_days_ago_str = seven_days_ago.isoformat()
        
        # Try to use last_accessed if available, otherwise use created_at
        try:
            old_docs = supabase.table("documents")\
                .select("id")\
                .eq("is_active", True)\
                .lt("last_accessed", seven_days_ago_str)\
                .execute()
            
            if old_docs.data:
                document_ids = [doc['id'] for doc in old_docs.data]
                supabase.table("documents")\
                    .update({"is_active": False})\
                    .in_("id", document_ids)\
                    .execute()
                return {"cleaned_up": len(document_ids), "document_ids": document_ids}
        except:
            # Fallback to created_at if last_accessed doesn't exist
            old_docs = supabase.table("documents")\
                .select("id")\
                .lt("created_at", seven_days_ago_str)\
                .execute()
            
            if old_docs.data:
                document_ids = [doc['id'] for doc in old_docs.data]
                supabase.table("documents")\
                    .delete()\
                    .in_("id", document_ids)\
                    .execute()
                return {"cleaned_up": len(document_ids), "document_ids": document_ids}
        
        return {"cleaned_up": 0, "document_ids": []}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cleanup failed: {str(e)}")

@router.post("/{document_id}/flashcards/generate", response_model=FlashcardListResponse)
async def generate_flashcards(document_id: str, req: FlashcardGenerationRequest):
    supabase = get_supabase()
    try:
        doc_resp = supabase.table("documents").select("content").eq("id", document_id).single().execute()
        if not doc_resp.data:
            raise HTTPException(status_code=404, detail="Document not found")
    except Exception as e:
        # Handle database errors (like invalid UUID format)
        if "invalid input syntax for type uuid" in str(e):
            raise HTTPException(status_code=400, detail="Invalid document ID format")
        raise HTTPException(status_code=404, detail="Document not found")
    
    text = doc_resp.data["content"]
    cards = await ai_client.generate_flashcards(text, req.count or 12, req.difficulty)
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
    try:
        doc_resp = supabase.table("documents").select("content").eq("id", document_id).single().execute()
        if not doc_resp.data:
            raise HTTPException(status_code=404, detail="Document not found")
    except Exception as e:
        # Handle database errors (like invalid UUID format)
        if "invalid input syntax for type uuid" in str(e):
            raise HTTPException(status_code=400, detail="Invalid document ID format")
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

@router.post("/{document_id}/quiz/generate", response_model=QuizResponse)
async def generate_quiz(document_id: str, req: QuizGenerationRequest):
    supabase = get_supabase()
    try:
        doc_resp = supabase.table("documents").select("content").eq("id", document_id).single().execute()
        if not doc_resp.data:
            raise HTTPException(status_code=404, detail="Document not found")
    except Exception as e:
        if "invalid input syntax for type uuid" in str(e):
            raise HTTPException(status_code=400, detail="Invalid document ID format")
        raise HTTPException(status_code=404, detail="Document not found")
    
    text = doc_resp.data["content"]
    questions = await ai_client.generate_quiz(text, req.difficulty)
    
    # Create quiz record
    quiz_id = str(uuid.uuid4())
    supabase.table("quizzes").insert({
        "id": quiz_id,
        "document_id": document_id,
        "difficulty": req.difficulty,
        "questions": questions,  # Store as JSON
        "created_at": "now()"
    }).execute()
    
    return QuizResponse(
        quiz_id=quiz_id,
        difficulty=req.difficulty,
        questions=questions
    )

@router.post("/quiz/{quiz_id}/submit", response_model=QuizResultResponse)
async def submit_quiz(quiz_id: str, answers: QuizAnswerRequest):
    supabase = get_supabase()
    try:
        quiz_resp = supabase.table("quizzes").select("*").eq("id", quiz_id).single().execute()
        if not quiz_resp.data:
            raise HTTPException(status_code=404, detail="Quiz not found")
    except Exception as e:
        if "invalid input syntax for type uuid" in str(e):
            raise HTTPException(status_code=400, detail="Invalid quiz ID format")
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    quiz_data = quiz_resp.data
    questions = quiz_data["questions"]
    user_answers = answers.answers
    
    if len(user_answers) != len(questions):
        raise HTTPException(status_code=400, detail="Answer count doesn't match question count")
    
    # Calculate results
    correct_count = 0
    results = []
    
    for i, question in enumerate(questions):
        user_answer = user_answers[i] if i < len(user_answers) else -1
        correct_answer = question["correct_answer"]
        is_correct = user_answer == correct_answer
        
        if is_correct:
            correct_count += 1
        
        results.append({
            "question_id": question["id"],
            "question": question["question"],
            "user_answer": user_answer,
            "correct_answer": correct_answer,
            "is_correct": is_correct,
            "explanation": question["explanation"]
        })
    
    total_questions = len(questions)
    percentage = (correct_count / total_questions) * 100 if total_questions > 0 else 0
    
    # Store quiz attempt
    supabase.table("quiz_attempts").insert({
        "id": str(uuid.uuid4()),
        "quiz_id": quiz_id,
        "answers": user_answers,
        "score": correct_count,
        "total_questions": total_questions,
        "percentage": percentage,
        "created_at": "now()"
    }).execute()
    
    return QuizResultResponse(
        quiz_id=quiz_id,
        score=correct_count,
        total_questions=total_questions,
        percentage=percentage,
        results=results
    )


@router.post("/{document_id}/generate-podcast", response_model=PodcastScript)
async def generate_podcast(
    document_id: str,
    request: PodcastGenerationRequest,
    authorization: str | None = Header(default=None)
):
    """Generate a podcast script from document content"""
    token = get_user_token(authorization)
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    supabase = get_supabase()
    
    # Get document content
    doc_response = supabase.table("documents").select("*").eq("id", document_id).execute()
    if not doc_response.data:
        raise HTTPException(status_code=404, detail="Document not found")
    
    document = doc_response.data[0]
    content = document["content"]
    
    # Set speaker names based on voice option
    speaker_names = {
        "male-male": ("Alex", "David"),
        "female-female": ("Sarah", "Emma"),
        "male-female": ("Marcus", "Lisa")
    }
    
    speaker1, speaker2 = speaker_names.get(request.voice_option, ("Host", "Guest"))
    
    # Generate podcast script using AI with concise content for token efficiency
    safe_content = content[:2000] if len(content) > 2000 else content  # Reduced from 4000 for efficiency
    
    from app.utils.prompts import PODCAST_PROMPT_TEMPLATE
    podcast_prompt = PODCAST_PROMPT_TEMPLATE.format(
        speaker1=speaker1,
        speaker2=speaker2,
        text=safe_content
    )
    
    try:
        ai_response = await ai_client.generate_text(podcast_prompt, max_tokens=2000)
        
        # Parse the AI response to extract dialogue
        dialogue_lines = []
        lines = ai_response.split('\n')
        current_speaker = 1
        
        for line in lines:
            line = line.strip()
            if not line or line.startswith('#') or line.startswith('*'):
                continue
                
            # Check if line contains speaker names
            if f"{speaker1}:" in line:
                current_speaker = 1
                text = line.split(f"{speaker1}:", 1)[1].strip()
            elif f"{speaker2}:" in line:
                current_speaker = 2
                text = line.split(f"{speaker2}:", 1)[1].strip()
            elif "Speaker 1:" in line:
                current_speaker = 1
                text = line.split("Speaker 1:", 1)[1].strip()
            elif "Speaker 2:" in line:
                current_speaker = 2
                text = line.split("Speaker 2:", 1)[1].strip()
            else:
                # If no speaker indicator, continue with current speaker
                text = line
            
            if text and len(text) > 10:  # Only add meaningful dialogue
                dialogue_lines.append({
                    "speaker": current_speaker,
                    "text": text
                })
                # Alternate speakers for next line if no explicit speaker
                current_speaker = 2 if current_speaker == 1 else 1
        
        # Ensure we have some dialogue - limit to 8 exchanges for conciseness
        if not dialogue_lines:
            # Fallback dialogue
            dialogue_lines = [
                {"speaker": 1, "text": f"Welcome! Today we're discussing this fascinating document."},
                {"speaker": 2, "text": f"Thanks {speaker1}! Let's dive into the key insights."},
                {"speaker": 1, "text": "The main points really stand out here."},
                {"speaker": 2, "text": "Absolutely. There are several important takeaways."},
                {"speaker": 1, "text": "What do you think is most significant?"},
                {"speaker": 2, "text": "The practical applications are quite interesting."},
            ]
        
        # Limit to 8 exchanges for concise audio
        dialogue_lines = dialogue_lines[:8]
        
        # Create podcast script
        script_id = str(uuid.uuid4())
        
        # Convert dialogue lines to PodcastDialogueLine objects (limited to 8 for conciseness)
        formatted_dialogue = [
            PodcastDialogueLine(speaker=line["speaker"], text=line["text"])
            for line in dialogue_lines[:8]  # Reduced from 15 to 8 exchanges
        ]
        
        # Store script in database (optional - comment out if table doesn't exist)
        try:
            supabase.table("podcast_scripts").insert({
                "id": script_id,
                "document_id": document_id,
                "speaker1": speaker1,
                "speaker2": speaker2,
                "dialogue": [line.dict() for line in formatted_dialogue],
                "voice_option": request.voice_option,
                "created_at": "now()"
            }).execute()
        except Exception as db_error:
            # If table doesn't exist, just log and continue
            print(f"Database insert failed (table may not exist): {db_error}")
        
        return PodcastScript(
            id=script_id,
            speaker1=speaker1,
            speaker2=speaker2,
            dialogue=formatted_dialogue,
            audio_url=None  # Will be generated separately with TTS service
        )
        
    except Exception as e:
        print(f"Error generating podcast: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate podcast script")
