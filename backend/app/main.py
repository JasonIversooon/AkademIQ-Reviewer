from dotenv import load_dotenv  # ensure .env is loaded before app imports
load_dotenv()  # load environment variables early

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware  # added
from app.api import auth, documents
import logging

# Basic logging config for debugging during development
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)
# Make sure uvicorn logs propagate to the root logger
logging.getLogger("uvicorn").propagate = True


app = FastAPI(title="AcademIQ Reviewer API")

# Allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(documents.router)

@app.get("/health")
async def health():
    return {"status": "ok"}
