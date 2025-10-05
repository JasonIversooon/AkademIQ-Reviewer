from fastapi import FastAPI
from app.api import auth, documents
from dotenv import load_dotenv  # added

load_dotenv()  # added to load .env before settings are accessed

app = FastAPI(title="AcademIQ Reviewer API")

app.include_router(auth.router)
app.include_router(documents.router)

@app.get("/health")
async def health():
    return {"status": "ok"}
