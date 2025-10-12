from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware  # added
from app.api import auth, documents
from dotenv import load_dotenv  # added

load_dotenv()  # added to load .env before settings are accessed

app = FastAPI(title="AcademIQ Reviewer API")

# allow explicit dev origins (include your LAN IP origin)
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173", 
    "http://192.168.100.25:5173",
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
