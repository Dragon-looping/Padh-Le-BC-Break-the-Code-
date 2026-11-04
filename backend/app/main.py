"""
PADH LE BC (Break the Code) - Educational Machine Learning Backend
Main FastAPI Application Entrypoint.
"""
import os
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database.db import init_db
from app.utils.file_utils import ensure_directories
from app.routes import datasets, models, experiments, lessons, explain

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager: initializes database tables and seeds built-in datasets.
    """
    ensure_directories()
    init_db()
    yield

app = FastAPI(
    title="PADH LE BC (Break the Code) — Educational ML API",
    description=(
        "Educational Machine Learning platform backend that helps students understand "
        "ML algorithms, experiment with datasets, compare models fairly, and select algorithms "
        "with evidence-based confidence.\n\n"
        "**Tagline:** Learn the algorithm. Understand the result. Choose with confidence."
    ),
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
default_origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173"
]
env_origins = os.getenv("CORS_ORIGINS")
if env_origins:
    origins = [o.strip() for o in env_origins.split(",") if o.strip()]
else:
    origins = default_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(datasets.router)
app.include_router(models.router)
app.include_router(experiments.router)
app.include_router(lessons.router)
app.include_router(explain.router)

@app.get("/api/health", tags=["Health"])
def health_check():
    """
    System health status endpoint.
    """
    return {
        "status": "healthy",
        "app": "PADH LE BC (Break the Code)",
        "version": "1.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "tagline": "Learn the algorithm. Understand the result. Choose with confidence."
    }

@app.get("/", tags=["Root"])
def root():
    """
    Root endpoint redirecting attention to interactive Swagger documentation.
    """
    return {
        "message": "Welcome to PADH LE BC (Break the Code) Educational ML Backend.",
        "documentation": "/docs",
        "health_check": "/api/health"
    }
