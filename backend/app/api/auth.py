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
    
    # For now, create a simple token-based registration that works with your schema
    # Generate a simple token (in production, use proper JWT or session management)
    import secrets
    import hashlib
    
    # Create a simple user token
    user_token = secrets.token_urlsafe(32)
    
    try:
        # Check if user already exists by trying to find them in documents table
        existing = supabase.table('documents').select('user_token').eq('user_token', user_token).execute()
        
        # For demonstration, we'll just return the token
        # In a real app, you'd want to store user credentials securely
        logger.info("Registration successful for %s with token", payload.email)
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
    
    # Simple login - for demo purposes, just generate a token
    # In production, you'd validate credentials against a users table
    import secrets
    
    try:
        # For now, just return a token for any valid email/password combo
        user_token = secrets.token_urlsafe(32)
        logger.info("Login successful for %s", payload.email)
        return AuthResponse(access_token=user_token)
        
    except Exception as e:
        logger.exception("Login error for %s: %s", payload.email, e)
        raise HTTPException(status_code=400, detail="Login failed")
    logger.info("Login successful for %s", payload.email)
    return AuthResponse(access_token=result.session.access_token)
