from supabase import create_client, Client
from .config import get_settings
from functools import lru_cache
import logging
import os
import pkgutil

_logger = logging.getLogger("app.core.supabase_client")

logger = logging.getLogger("app.core.supabase_client")

@lru_cache
def get_supabase() -> Client:
    settings = get_settings()
    # Log presence of settings (don't print secrets)
    logger.debug("Supabase URL configured: %s", bool(settings.supabase_url))
    logger.debug("Supabase ANON key present: %s", bool(settings.supabase_anon_key))
    logger.debug("Supabase SERVICE key present: %s", bool(settings.supabase_service_key))
    # Probe for proxy env vars and relevant package versions
    proxy_vars = {k: os.environ.get(k) for k in ("HTTP_PROXY", "http_proxy", "HTTPS_PROXY", "https_proxy")}
    _logger.debug("Proxy env vars: %s", {k: bool(v) for k, v in proxy_vars.items()})
    try:
        import httpx as _httpx
        _logger.debug("httpx version: %s", getattr(_httpx, '__version__', 'unknown'))
    except Exception:
        _logger.debug("httpx not importable in venv")
    try:
        import supabase as _sup
        _logger.debug("supabase package version: %s", getattr(_sup, '__version__', 'unknown'))
    except Exception:
        _logger.debug("supabase package not importable for version check")
    if not settings.supabase_url or not settings.supabase_anon_key:
        logger.error("Supabase credentials missing: supabase_url=%s anon_key=%s", bool(settings.supabase_url), bool(settings.supabase_anon_key))
        raise RuntimeError("Supabase credentials not configured.")
    try:
        # Use anon key for client-side operations like user registration
        client = create_client(settings.supabase_url, settings.supabase_anon_key)
        logger.info("Supabase client created successfully")
        return client
    except Exception as e:
        # Log environment snapshot and full exception to help trace where unexpected args come from
        full_env_snapshot = {k: bool(os.environ.get(k)) for k in ["HTTP_PROXY", "http_proxy", "HTTPS_PROXY", "https_proxy"]}
        _logger.exception("Failed to create Supabase client. proxy env snapshot=%s; error=%s", full_env_snapshot, e)
        raise
