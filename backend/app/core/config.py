from pydantic import BaseModel
from functools import lru_cache
import os

class Settings(BaseModel):
    supabase_url: str | None = None
    supabase_anon_key: str | None = None
    supabase_service_key: str | None = None
    openai_api_key: str | None = None  # legacy (unused now)
    groq_api_key: str | None = None    # added
    ai_model: str = "openai/gpt-oss-20b"
    max_pdf_pages: int = 10

    class Config:
        arbitrary_types_allowed = True

@lru_cache
def get_settings() -> Settings:
    return Settings(
        supabase_url=os.getenv("SUPABASE_URL"),
        supabase_anon_key=os.getenv("SUPABASE_ANON_KEY"),
        supabase_service_key=os.getenv("SUPABASE_SERVICE_KEY"),
        openai_api_key=os.getenv("OPENAI_API_KEY"),
        groq_api_key=os.getenv("GROQ_API_KEY"),  # added
        ai_model=os.getenv("AI_MODEL", "openai/gpt-oss-20b"),
        max_pdf_pages=int(os.getenv("MAX_PDF_PAGES", "10")),
    )
