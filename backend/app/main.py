from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import videos
from app.core.config import settings
import logging
import sys

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('app.log')
    ]
)

logger = logging.getLogger(__name__)

app = FastAPI(
    title="YouTube Digest API",
    description="API for processing and analyzing YouTube videos",
    version=settings.VERSION
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(videos.router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {
        "message": "Welcome to YouTube Digest API",
        "docs_url": "/docs",
        "version": settings.VERSION
    }

@app.on_event("startup")
async def startup_event():
    logger.info("Starting up YouTube Digest API")
    logger.info(f"OpenAI API key present: {bool(settings.OPENAI_API_KEY)}")
