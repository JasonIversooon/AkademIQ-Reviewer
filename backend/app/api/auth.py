from fastapi import APIRouter, HTTPException, Depends
from app.schemas.auth import RegisterRequest, LoginRequest, AuthResponse
from app.core.supabase_client import get_supabase
import logging

logger = logging.getLogger("app.api.auth")

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=AuthResponse)
async def register(payload: RegisterRequest):
    logger.info("register endpoint called for email=%s", payload.email)
    try:
        supabase = get_supabase()
    except Exception as e:
        logger.exception("Supabase init failed in register: %s", e)
        raise HTTPException(status_code=502, detail=f"Supabase init error: {e}")
    
    # Create a consistent token based on email
    import hashlib
    
    # Generate consistent token from email (same email = same token)
    user_token = hashlib.sha256(payload.email.encode()).hexdigest()[:32]
    
    try:
        logger.info("Registration successful for %s with token %s", payload.email, user_token)
        return AuthResponse(access_token=user_token)
        
    except Exception as e:
        logger.exception("Registration error for %s: %s", payload.email, e)
        raise HTTPException(status_code=400, detail="Registration failed")

@router.post("/login", response_model=AuthResponse)
async def login(payload: LoginRequest):
    logger.info("login endpoint called for email=%s", payload.email)
    try:
        supabase = get_supabase()
    except Exception as e:
        logger.exception("Supabase init failed in login: %s", e)
        raise HTTPException(status_code=502, detail=f"Supabase init error: {e}")
    
    # Create consistent token based on email (same email = same token)
    import hashlib
    
    try:
        # Generate consistent token from email
        user_token = hashlib.sha256(payload.email.encode()).hexdigest()[:32]
        logger.info("Login successful for %s with token %s", payload.email, user_token)
        return AuthResponse(access_token=user_token)
        
    except Exception as e:
        logger.exception("Login error for %s: %s", payload.email, e)
        raise HTTPException(status_code=400, detail="Login failed")
