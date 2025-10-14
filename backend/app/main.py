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

# allow explicit dev origins (include your LAN IP origin)
origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174", 
    "http://192.168.0.142:5173",
    "http://192.168.0.142:5174",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(documents.router)

@app.get("/health")
async def health():
    return {"status": "ok"}
