from app.core.config import get_settings
import httpx
import json
import logging
from groq import AsyncGroq, GroqError
from app.utils.prompts import FLASHCARD_PROMPT_TEMPLATE, EXPLANATION_PROMPT_TEMPLATE

logger = logging.getLogger("ai_client")

# This is a stub wrapper for AI calls. Replace with actual OpenAI / Gemini as needed.

async def generate_flashcards(text: str, count: int = 12, difficulty: str = "medium") -> list[dict]:
    safe_text = _truncate_text(text)
    prompt = FLASHCARD_PROMPT_TEMPLATE.format(count=count, text=safe_text, difficulty=difficulty)
    raw = await _chat(prompt, max_tokens=2000, temperature=0.3)
    # Attempt to parse JSON; fallback to synthetic if parsing fails
    try:
        # Clean the response - remove any non-JSON text
        raw_cleaned = raw.strip()
        
        # Look for JSON array in the response
        start_idx = raw_cleaned.find('[')
        end_idx = raw_cleaned.rfind(']') + 1
        
        if start_idx != -1 and end_idx > start_idx:
            json_str = raw_cleaned[start_idx:end_idx]
            data = json.loads(json_str)
        else:
            data = json.loads(raw_cleaned)
        
        cards = []
        for i, item in enumerate(data):
            import uuid
            # Generate unique UUID for each flashcard instead of using AI-generated IDs
            cid = str(uuid.uuid4())
            cards.append({
                "id": cid,
                "question": item.get("question", "Missing question"),
                "answer": item.get("answer", "Missing answer"),
                "status": "new",
            })
        if cards:
            logger.info(f"Successfully parsed {len(cards)} flashcards from AI response")
            return cards
    except Exception as e:
        logger.warning(f"Failed to parse flashcard JSON: {e}. Raw response: {raw[:200]}...")
    # Fallback
    import uuid
    return [
        {
            "id": str(uuid.uuid4()),
            "question": f"Placeholder question {i+1}",
            "answer": "Placeholder answer (AI parsing failed).",
            "status": "new",
        }
        for i in range(count)
    ]

async def generate_explanation(text: str, style: str) -> str:
    safe_text = _truncate_text(text, max_chars=15000)
    prompt = EXPLANATION_PROMPT_TEMPLATE.format(style=style, text=safe_text)
    return await _chat(prompt, max_tokens=1500, temperature=0.55)

async def generate_quiz(text: str, difficulty: str = "medium") -> list[dict]:
    # Determine question count based on difficulty
    count_map = {"easy": 8, "medium": 12, "hard": 15}
    count = count_map.get(difficulty, 12)
    
    safe_text = _truncate_text(text)
    from app.utils.prompts import QUIZ_PROMPT_TEMPLATE
    prompt = QUIZ_PROMPT_TEMPLATE.format(count=count, text=safe_text, difficulty=difficulty)
    raw = await _chat(prompt, max_tokens=3000, temperature=0.3)
    
    # Parse JSON response
    try:
        # Clean the response - remove any non-JSON text
        raw_cleaned = raw.strip()
        
        # Look for JSON array in the response
        start_idx = raw_cleaned.find('[')
        end_idx = raw_cleaned.rfind(']') + 1
        
        if start_idx != -1 and end_idx > start_idx:
            json_str = raw_cleaned[start_idx:end_idx]
            data = json.loads(json_str)
        else:
            data = json.loads(raw_cleaned)
        
        questions = []
        for i, item in enumerate(data):
            import uuid
            # Generate unique UUID for each question
            qid = str(uuid.uuid4())
            questions.append({
                "id": qid,
                "question": item.get("question", "Missing question"),
                "options": item.get("options", ["Option A", "Option B", "Option C", "Option D"]),
                "correct_answer": item.get("correct_answer", 0),
                "explanation": item.get("explanation", "Missing explanation")
            })
        
        if questions:
            logger.info(f"Successfully parsed {len(questions)} quiz questions from AI response")
            return questions
            
    except Exception as e:
        logger.warning(f"Failed to parse quiz JSON: {e}. Raw response: {raw[:200]}...")
    
    # Fallback
    import uuid
    return [
        {
            "id": str(uuid.uuid4()),
            "question": f"Placeholder question {i+1}",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correct_answer": 0,
            "explanation": "Placeholder explanation (AI parsing failed)."
        }
        for i in range(count)
    ]

_settings_cache = None
_client_cache: AsyncGroq | None = None

def _get_client() -> AsyncGroq:
    global _client_cache, _settings_cache
    if _client_cache is None:
        _settings_cache = get_settings()
        if not _settings_cache.groq_api_key:
            raise RuntimeError("GROQ_API_KEY not set")
        _client_cache = AsyncGroq(api_key=_settings_cache.groq_api_key)
    return _client_cache

def _truncate_text(text: str, max_chars: int = 12000) -> str:
    if len(text) <= max_chars:
        return text
    return text[:max_chars] + "\n...[TRUNCATED]..."

async def _chat(prompt: str, max_tokens: int = 1800, temperature: float = 0.6) -> str:
    client = _get_client()
    settings = get_settings()
    try:
        resp = await client.chat.completions.create(
            model=settings.ai_model,
            messages=[{"role": "user", "content": prompt}],
            temperature=temperature,
            max_tokens=max_tokens,
            top_p=0.9,
        )
        return resp.choices[0].message.content
    except GroqError as e:
        logger.error(f"Groq API error: {e}")
        return "[ERROR] AI provider error."
    except Exception as e:
        logger.error(f"Unexpected AI error: {e}")
        return "[ERROR] AI unavailable."
