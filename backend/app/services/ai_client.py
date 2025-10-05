from . import prompts  # noqa: F401 (placeholder for future)
from app.core.config import get_settings
import httpx
import json
import logging
from groq import AsyncGroq, GroqError
from .prompts import FLASHCARD_PROMPT_TEMPLATE, EXPLANATION_PROMPT_TEMPLATE

logger = logging.getLogger("ai_client")

# This is a stub wrapper for AI calls. Replace with actual OpenAI / Gemini as needed.

async def generate_flashcards(text: str, count: int = 12) -> list[dict]:
    safe_text = _truncate_text(text)
    prompt = FLASHCARD_PROMPT_TEMPLATE.format(count=count, text=safe_text)
    raw = await _chat(prompt, max_tokens=2000)
    # Attempt to parse JSON; fallback to synthetic if parsing fails
    try:
        data = json.loads(raw)
        cards = []
        for i, item in enumerate(data):
            cid = item.get("id") or f"gen-{i+1}"
            cards.append({
                "id": cid,
                "question": item.get("question", "Missing question"),
                "answer": item.get("answer", "Missing answer"),
                "status": "new",
            })
        if cards:
            return cards
    except Exception:
        logger.warning("Failed to parse flashcard JSON; returning fallback stub.")
    # Fallback
    return [
        {
            "id": f"fallback-{i+1}",
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
