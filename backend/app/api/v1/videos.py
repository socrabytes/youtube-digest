from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, HttpUrl
from typing import List, Optional
from datetime import datetime

router = APIRouter()

class VideoBase(BaseModel):
    url: HttpUrl
    title: Optional[str] = None

class VideoCreate(VideoBase):
    pass

class VideoDigest(BaseModel):
    id: str
    summary: str
    key_points: List[str]
    timestamps: List[dict]
    created_at: datetime

class Video(VideoBase):
    id: str
    status: str
    digest: Optional[VideoDigest] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Temporary storage (replace with database later)
videos_db = {}

@router.post("/videos/", response_model=Video)
async def create_video(video: VideoCreate):
    """Submit a new video for processing"""
    video_id = str(len(videos_db) + 1)
    new_video = Video(
        id=video_id,
        url=video.url,
        title=video.title,
        status="pending",
        created_at=datetime.now()
    )
    videos_db[video_id] = new_video
    return new_video

@router.get("/videos/", response_model=List[Video])
async def list_videos():
    """Get all processed videos"""
    return list(videos_db.values())

@router.get("/videos/{video_id}", response_model=Video)
async def get_video(video_id: str):
    """Get a specific video and its digest"""
    if video_id not in videos_db:
        raise HTTPException(status_code=404, detail="Video not found")
    return videos_db[video_id]
