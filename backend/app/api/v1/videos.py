from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel, HttpUrl
from typing import List, Optional
from datetime import datetime

from app.db.database import get_db
from app.models.video import Video as VideoModel
from app.services.video_processor import VideoProcessor

router = APIRouter()

class VideoBase(BaseModel):
    url: HttpUrl

class VideoCreate(VideoBase):
    pass

class VideoResponse(BaseModel):
    id: int
    youtube_id: str
    title: str
    url: str
    thumbnail_url: Optional[str]
    summary: Optional[str]
    processed: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

@router.post("/videos/", response_model=VideoResponse)
async def create_video(video: VideoCreate, db: Session = Depends(get_db)):
    """Submit a new video for processing"""
    processor = VideoProcessor()
    
    try:
        # Extract video information
        video_info = processor.extract_video_info(str(video.url))
        
        # Create video entry
        db_video = VideoModel(
            youtube_id=video_info['youtube_id'],
            title=video_info['title'],
            url=str(video.url),
            thumbnail_url=video_info['thumbnail_url'],
            processed=False
        )
        
        db.add(db_video)
        db.commit()
        db.refresh(db_video)
        
        return db_video
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/videos/", response_model=List[VideoResponse])
async def list_videos(db: Session = Depends(get_db)):
    """Get all videos"""
    try:
        return db.query(VideoModel).all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/videos/{video_id}", response_model=VideoResponse)
async def get_video(video_id: int, db: Session = Depends(get_db)):
    """Get a specific video and its digest"""
    try:
        video = db.query(VideoModel).filter(VideoModel.id == video_id).first()
        if video is None:
            raise HTTPException(status_code=404, detail="Video not found")
        return video
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/videos/{video_id}/process")
async def process_video(video_id: int, db: Session = Depends(get_db)):
    """Process a video to generate its summary"""
    try:
        video = db.query(VideoModel).filter(VideoModel.id == video_id).first()
        if video is None:
            raise HTTPException(status_code=404, detail="Video not found")
        
        if video.processed:
            raise HTTPException(status_code=400, detail="Video already processed")
        
        processor = VideoProcessor()
        summary = await processor.generate_summary(video.title, "")  # You might want to fetch video description
        
        video.summary = summary
        video.processed = True
        db.commit()
        db.refresh(video)
        
        return {"message": "Video processed successfully", "video": video}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
