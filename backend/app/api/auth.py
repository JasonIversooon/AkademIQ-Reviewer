from fastapi import APIRouter, HTTPException, Depends
from app.schemas.auth import RegisterRequest, LoginRequest, AuthResponse
from app.core.supabase_client import get_supabase

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=AuthResponse)
async def register(payload: RegisterRequest):
    try:
        supabase = get_supabase()
    except Exception as e:
        # return a controlled 502 so CORS headers are applied and you get a readable error
        raise HTTPException(status_code=502, detail=f"Supabase init error: {e}")
    # Use GoTrue sign up
    try:
        result = supabase.auth.sign_up({"email": payload.email, "password": payload.password})
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    if not result or not result.session:
        raise HTTPException(status_code=400, detail="Registration failed")
    return AuthResponse(access_token=result.session.access_token)

@router.post("/login", response_model=AuthResponse)
async def login(payload: LoginRequest):
    try:
        supabase = get_supabase()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Supabase init error: {e}")
    try:
        result = supabase.auth.sign_in_with_password({"email": payload.email, "password": payload.password})
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    if not result or not result.session:
        raise HTTPException(status_code=400, detail="Login failed")
    return AuthResponse(access_token=result.session.access_token)
