from dotenv import load_dotenv  # ensure .env is loaded before app imports
load_dotenv()  # load environment variables early

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware  # added
from app.api import auth, documents
import logging
import os

# Basic logging config for debugging during development
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)
# Make sure uvicorn logs propagate to the root logger
logging.getLogger("uvicorn").propagate = True


app = FastAPI(title="AcademIQ Reviewer API")

# Configure CORS origins. Priority:
# 1. ALLOWED_ORIGINS (comma-separated)
# 2. FRONTEND_URL (single origin) — default to the provided frontend URL
# 3. Fallback to allow all origins for local testing
allowed_origins_env = os.getenv("ALLOWED_ORIGINS")
frontend_url = os.getenv("FRONTEND_URL", "https://akademiq-reviewer-frontend.onrender.com")
if allowed_origins_env:
    allowed_origins = [o.strip() for o in allowed_origins_env.split(",") if o.strip()]
elif frontend_url:
    # include the production frontend URL and also allow '*' for local testing as requested
    allowed_origins = [frontend_url.rstrip("/"), "*"]
else:
    allowed_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(documents.router)

@app.get("/health")
async def health():
    return {"status": "ok"}
