from fastapi import APIRouter
from app.api.v1 import videos, channels, transcripts, digests, users, categories, llms

api_router = APIRouter()

# Include all routers
api_router.include_router(videos.router, tags=["videos"])
api_router.include_router(channels.router, tags=["channels"])
api_router.include_router(transcripts.router, tags=["transcripts"])
api_router.include_router(digests.router, tags=["digests"])
api_router.include_router(users.router, tags=["users"])
api_router.include_router(categories.router, tags=["categories"])
api_router.include_router(llms.router, tags=["llms"])
