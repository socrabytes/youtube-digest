from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel, HttpUrl
from typing import List, Optional, Dict, Any
from datetime import datetime
import logging

from app.db.database import get_db
from app.models.video import Video as VideoModel
from app.services.video_processor import VideoProcessor

logger = logging.getLogger(__name__)

router = APIRouter()

class VideoBase(BaseModel):
    url: HttpUrl

class VideoCreate(VideoBase):
    pass

class VideoResponse(BaseModel):
    id: int
    youtube_id: Optional[str]
    title: Optional[str]
    url: str
    thumbnail_url: Optional[str]
    
    # Video metadata
    duration: Optional[int]
    view_count: Optional[int]
    channel_id: Optional[str]
    channel_title: Optional[str]
    
    # Content analysis
    tags: Optional[List[str]]
    categories: Optional[List[str]]
    transcript: Optional[str]
    sentiment_score: Optional[int]
    
    # Processing status
    summary: Optional[str]
    processed: bool
    error_message: Optional[str]
    
    # Timestamps
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

@router.post("/videos/", response_model=VideoResponse)
async def create_video(video: VideoCreate, db: Session = Depends(get_db)):
    """Submit a new video for processing"""
    logger.info(f"Processing video URL: {video.url}")
    processor = VideoProcessor()
    
    try:
        # Extract video information
        video_info = processor.extract_video_info(str(video.url))
        logger.info("Successfully extracted video info")
        
        # Check if video already exists
        existing_video = db.query(VideoModel).filter(
            VideoModel.youtube_id == video_info['youtube_id']
        ).first()
        
        if existing_video:
            logger.info(f"Video {video_info['youtube_id']} already exists, updating...")
            # Update existing video
            for key, value in video_info.items():
                if hasattr(existing_video, key):
                    setattr(existing_video, key, value)
            existing_video.processed = False  # Reset processed flag for re-processing
            existing_video.error_message = None
            db_video = existing_video
        else:
            logger.info(f"Creating new video entry for {video_info['youtube_id']}")
            # Create new video entry
            db_video = VideoModel(
                youtube_id=video_info.get('youtube_id'),
                title=video_info.get('title'),
                url=str(video.url),
                thumbnail_url=video_info.get('thumbnail_url'),
                duration=video_info.get('duration'),
                view_count=video_info.get('view_count'),
                channel_id=video_info.get('channel_id'),
                channel_title=video_info.get('channel_title'),
                tags=video_info.get('tags', []),
                categories=video_info.get('categories', []),
                transcript=video_info.get('transcript'),
                processed=False,
                error_message=None
            )
            db.add(db_video)
        
        logger.info("Saving to database")
        db.commit()
        db.refresh(db_video)
        logger.info(f"Successfully saved video with ID: {db_video.id}")
        
        return db_video
        
    except Exception as e:
        logger.error(f"Error processing video: {str(e)}", exc_info=True)
        error_msg = str(e)
        
        # Rollback the session to handle any transaction errors
        db.rollback()
        
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Failed to process video",
                "error": error_msg
            }
        )

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

@router.post("/videos/{video_id}/process", response_model=VideoResponse)
async def process_video(video_id: int, db: Session = Depends(get_db)):
    """Process a video to generate its summary"""
    logger.info(f"Processing video ID: {video_id}")
    try:
        video = db.query(VideoModel).filter(VideoModel.id == video_id).first()
        if video is None:
            logger.error(f"Video not found with ID: {video_id}")
            raise HTTPException(status_code=404, detail="Video not found")
        
        processor = VideoProcessor()
        
        # Prepare video data for summary generation
        video_data = {
            'youtube_id': video.youtube_id,
            'title': video.title,
            'duration': video.duration,
            'categories': video.categories,
            'tags': video.tags,
        }
        
        # Generate summary
        logger.info(f"Generating summary for video: {video.youtube_id}")
        summary = processor.generate_summary(video_data)
        
        if summary:
            video.summary = summary
            video.processed = True
            video.error_message = None
        else:
            video.processed = False
            video.error_message = "Failed to generate summary"
            
        logger.info("Saving changes to database")
        db.commit()
        db.refresh(video)
        
        return video
        
    except Exception as e:
        logger.error(f"Error processing video: {str(e)}", exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail={
                "message": "Failed to process video",
                "error": str(e)
            }
        )
