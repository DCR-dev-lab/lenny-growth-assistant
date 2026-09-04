"""
Main Application Entrypoint for The Lenny Growth Assistant Backend.
FastAPI framework with CORS, Lifespan initialization, and structured logging.
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.database import init_db
from app.api import sessions, chat, health

# Configure Structured Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("lenny_backend")
settings = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager for startup and shutdown routines."""
    logger.info("Initializing The Lenny Growth Assistant backend service...")
    await init_db()
    logger.info("Backend service startup completed.")
    yield
    logger.info("Shutting down backend service.")

app = FastAPI(
    title="The Lenny Growth Assistant API",
    description="Enterprise-grade RAG and Agentic Assistant for Product and Growth Leaders.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
origins = [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error", "error": str(exc)}
    )

# Mount API Routers
app.include_router(sessions.router)
app.include_router(chat.router)
app.include_router(health.router)

@app.get("/")
async def root():
    return {
        "service": "The Lenny Growth Assistant API",
        "status": "operational",
        "docs_url": "/docs",
        "health_url": "/api/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
