from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import videos
from app.core.config import settings

app = FastAPI(
    title="YouTube Digest API",
    description="API for processing and analyzing YouTube videos",
    version=settings.VERSION
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
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
