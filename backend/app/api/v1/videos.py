from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel, HttpUrl
from typing import List, Optional, Dict, Any
from datetime import datetime
import logging
import json

from app.db.database import get_db, SessionLocal
from app.models.video import Video as VideoModel, ProcessingStatus
from app.services.video_processor import (
    VideoProcessor,
    VideoProcessingError,
    VideoNotFoundError,
    PrivateVideoError,
    RateLimitError
)
from app.services.transcript_service import TranscriptService, VideoTranscriptError
from app.services.summarizers.openai_summarizer import OpenAISummarizer, SummaryGenerationError

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
    subscriber_count: Optional[int]
    channel_id: Optional[str]
    channel_title: Optional[str]
    upload_date: Optional[str]
    like_count: Optional[int]
    description: Optional[str]
    
    # Content analysis
    tags: Optional[List[str]]
    categories: Optional[List[str]]
    transcript: Optional[str]
    sentiment_score: Optional[int]
    
    # Processing status
    summary: Optional[str]
    processed: bool
    error_message: Optional[str]
    processing_status: Optional[str]
    last_processed: Optional[datetime]
    
    # Timestamps
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

def process_video_background(video_id: int):
    """Background task for processing a video."""
    logger.info(f"[Background Task] Starting processing for video ID: {video_id}")
    db = SessionLocal()
    failed_stages = []
    summary_attempts = 0
    last_successful_stage = None
    try:
        logger.info(f"[Background Task] Retrieved database session for video ID: {video_id}")
        video = db.query(VideoModel).filter(VideoModel.id == video_id).first()
        if video is None:
            logger.error(f"[Background Task] Video not found with ID: {video_id}")
            return
        
        logger.info(f"[Background Task] Updating status to PROCESSING for video ID: {video_id}")
        video.processing_status = ProcessingStatus.PROCESSING
        db.commit()
        logger.info(f"[Background Task] Status updated to PROCESSING for video ID: {video_id}")
        
        processor = VideoProcessor()
        
        try:
            if not video.transcript:
                logger.info(f"[Background Task] Starting transcript extraction for video ID: {video_id}")
                transcript_service = TranscriptService()
                transcript, meta = transcript_service.extract_transcript(video.url)
                logger.info(f"[Background Task] Extracted {len(transcript)} character transcript for video ID: {video_id}")
                
                logger.info(f"[Background Task] Updating transcript and status to SUMMARIZING for video ID: {video_id}")
                video.transcript = transcript
                video.processing_status = ProcessingStatus.SUMMARIZING
                db.commit()
                logger.info(f"[Background Task] Transcript updated and status set to SUMMARIZING for video ID: {video_id}")
                last_successful_stage = "transcript_extraction"
            
            video_data = {
                'youtube_id': video.youtube_id,
                'title': video.title,
                'duration': video.duration,
                'categories': video.categories,
                'tags': video.tags,
                'transcript': video.transcript
            }
            
            logger.info(f"[Background Task] Starting summary generation for video ID: {video_id}")
            summary = processor.generate_summary(video_data)
            summary_attempts += 1
            
            if summary:
                logger.info(f"[Background Task] Successfully generated {len(summary)} character summary for video ID: {video_id}")
                video.summary = summary
                video.processed = True
                video.error_message = None
                video.processing_status = ProcessingStatus.COMPLETED
                last_successful_stage = "summary_generation"
            else:
                logger.warning(f"[Background Task] Empty summary returned for video ID: {video_id}")
                video.processed = False
                video.error_message = "Failed to generate summary"
                video.processing_status = ProcessingStatus.FAILED
                failed_stages.append("summary_generation")
            
            logger.info(f"[Background Task] Finalizing updates for video ID: {video_id}")
            db.commit()
            logger.info(f"[Background Task] Successfully completed processing for video ID: {video_id}")
            
        except Exception as e:
            logger.error(f"[Background Task] Error during processing: {str(e)}", exc_info=True)
            video.processed = False
            video.error_message = str(e)
            video.processing_status = ProcessingStatus.FAILED
            db.commit()
            logger.error(f"[Background Task] Marked video ID {video_id} as FAILED")
            failed_stages.append("processing")
            
    except Exception as e:
        logger.error("[Background Task] Critical pipeline failure", exc_info=True)
        logger.error(f"Failed processing stages: {', '.join(failed_stages) if failed_stages else 'Unknown'}")
        logger.error(f"Current video state: {video.__dict__ if video else 'No video object'}")
        logger.error(f"Transcript exists: {bool(video.transcript) if video else False}")
        logger.error(f"Summary generation attempts: {summary_attempts}")
        logger.error(f"Last successful stage: {last_successful_stage or 'None'}")
        try:
            db.rollback()
        except Exception as rollback_error:
            logger.error(f"[Background Task] Rollback failed: {str(rollback_error)}")
    finally:
        try:
            db.close()
            logger.info(f"[Background Task] Closed database connection for video ID: {video_id}")
        except Exception as close_error:
            logger.error(f"[Background Task] Failed to close connection: {str(close_error)}")

@router.post("/videos/", response_model=VideoResponse)
async def create_video(
    video: VideoCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Submit a new video for processing"""
    logger.info(f"Processing video URL: {video.url}")
    processor = VideoProcessor()
    
    try:
        # Extract video information with validation
        video_info = processor.validate_and_extract_info(str(video.url))
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
            existing_video.processing_status = ProcessingStatus.PENDING
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
                subscriber_count=video_info.get('subscriber_count'),
                channel_id=video_info.get('channel_id'),
                channel_title=video_info.get('channel_title'),
                upload_date=video_info.get('upload_date'),
                like_count=video_info.get('like_count'),
                description=video_info.get('description'),
                tags=video_info.get('tags', []),
                categories=video_info.get('categories', []),
                transcript=video_info.get('transcript'),
                processed=False,
                error_message=None,
                processing_status=ProcessingStatus.PENDING
            )
            db.add(db_video)
            
        db.commit()
        db.refresh(db_video)
        
        # Start background processing
        background_tasks.add_task(process_video_background, db_video.id)
        
        return db_video
        
    except VideoNotFoundError as e:
        logger.error(f"Video not found error: {str(e)}")
        raise HTTPException(
            status_code=404,
            detail=f"Video not found or no longer available: {str(e)}"
        )
    except PrivateVideoError as e:
        logger.error(f"Private video error: {str(e)}")
        raise HTTPException(
            status_code=403,
            detail=f"This video is private and cannot be accessed: {str(e)}"
        )
    except RateLimitError as e:
        logger.error(f"Rate limit error: {str(e)}")
        raise HTTPException(
            status_code=429,
            detail=f"YouTube API rate limit exceeded: {str(e)}"
        )
    except VideoProcessingError as e:
        logger.error(f"Video processing error: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error processing video: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"An unexpected error occurred while processing the video: {str(e)}"
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
        
        # Update status to processing
        video.processing_status = ProcessingStatus.PROCESSING
        db.commit()
        
        processor = VideoProcessor()
        
        try:
            # Extract transcript if not already present
            if not video.transcript:
                logger.info("Extracting transcript")
                transcript_service = TranscriptService()
                transcript, meta = transcript_service.extract_transcript(video.url)
                video.transcript = transcript
                video.processing_status = ProcessingStatus.SUMMARIZING
                db.commit()
            
            # Prepare video data for summary generation
            video_data = {
                'youtube_id': video.youtube_id,
                'title': video.title,
                'duration': video.duration,
                'categories': video.categories,
                'tags': video.tags,
                'transcript': video.transcript
            }
            
            # Generate summary
            logger.info(f"Generating summary for video: {video.youtube_id}")
            summary = processor.generate_summary(video_data)
            
            if summary:
                video.summary = summary
                video.processed = True
                video.error_message = None
                video.processing_status = ProcessingStatus.COMPLETED
            else:
                video.processed = False
                video.error_message = "Failed to generate summary"
                video.processing_status = ProcessingStatus.FAILED
                
            logger.info("Saving changes to database")
            db.commit()
            db.refresh(video)
            
            return video
            
        except Exception as e:
            logger.error(f"Error during processing: {str(e)}", exc_info=True)
            video.processed = False
            video.error_message = str(e)
            video.processing_status = ProcessingStatus.FAILED
            db.commit()
            raise
            
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

@router.post("/videos/{video_id}/generate-summary")
async def generate_summary(
    video_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Generate AI summary for a video."""
    video = db.query(VideoModel).get(video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    try:
        # Extract transcript if not already present
        if not video.transcript:
            transcript, meta = TranscriptService.extract_transcript(video.url)
            video.transcript = transcript
            video.transcript_source = meta['source']
        
        # Update status to processing
        video.processing_status = ProcessingStatus.PROCESSING
        db.commit()
        
        # Add background task for summary generation
        background_tasks.add_task(process_summary_generation, video_id, video.transcript)
        
        return {"message": "Summary generation started"}
        
    except VideoTranscriptError as e:
        logger.error(f"Transcript error: {str(e)}")
        video.error_message = str(e)
        video.processing_status = ProcessingStatus.FAILED
        db.commit()
        raise HTTPException(status_code=400, detail=str(e))
        
    except Exception as e:
        logger.error(f"Error: {str(e)}", exc_info=True)
        video.error_message = str(e)
        video.processing_status = ProcessingStatus.FAILED
        db.commit()
        raise HTTPException(status_code=500, detail=str(e))

async def process_summary_generation(video_id: int, transcript: str):
    """Background task for summary generation."""
    db = SessionLocal()
    try:
        video = db.query(VideoModel).get(video_id)
        if not video:
            logger.error(f"Video {video_id} not found")
            return
        
        try:
            summarizer = OpenAISummarizer()
            summary = summarizer.generate_summary(transcript)
            
            video.summary = summary
            video.processed = True
            video.error_message = None
            video.processing_status = ProcessingStatus.COMPLETED
            db.commit()
            
        except Exception as e:
            logger.error(f"Summary generation error: {str(e)}", exc_info=True)
            video.error_message = str(e)
            video.processing_status = ProcessingStatus.FAILED
            db.commit()
            
    finally:
        db.close()

@router.get("/videos/debug/{url:path}")
async def debug_video_extraction(url: str):
    """Extract and return raw video info for debugging purposes."""
    try:
        processor = VideoProcessor()
        video_info = processor.validate_and_extract_info(url)
        return video_info
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
