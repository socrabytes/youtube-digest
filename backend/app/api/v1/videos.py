from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel, HttpUrl, validator, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
import logging
import re

from app.db.database import get_db, SessionLocal
from app.models.video import Video as VideoModel, ProcessingStatus
from app.models.channel import Channel as ChannelModel
from app.models.transcript import Transcript as TranscriptModel, TranscriptStatus
from app.models.digest import Digest as DigestModel, DigestType
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
    
    @validator('url')
    def validate_youtube_url(cls, v):
        """Validate that the URL is a YouTube URL."""
        youtube_regex = r'^(https?://)?(www\.)?(youtube\.com|youtu\.be)/.+$'
        if not re.match(youtube_regex, str(v)):
            raise ValueError("URL must be a valid YouTube URL")
        return v

class VideoCreate(VideoBase):
    pass

class ChannelInfo(BaseModel):
    id: int
    youtube_channel_id: str
    name: str
    thumbnail_url: Optional[str] = None
    subscriber_count: Optional[int] = None
    
    class Config:
        from_attributes = True

class VideoResponse(BaseModel):
    id: int
    youtube_id: str
    title: str
    url: Optional[str] = None  # Will be populated from webpage_url
    thumbnail_url: Optional[str] = None  # Will be populated from thumbnail
    
    # Video metadata
    duration: int
    view_count: Optional[int] = None
    like_count: Optional[int] = None
    description: Optional[str] = None
    
    # Content metadata
    tags: Optional[List[str]] = None
    categories: Optional[List[str]] = None
    chapters: Optional[List[Dict[str, Any]]] = None
    
    # Channel information
    channel_id: int
    channel: Optional[ChannelInfo] = None
    
    # Processing status
    summary: Optional[str] = None
    processed: bool = False
    error_message: Optional[str] = None
    processing_status: str = Field(..., description="Current processing status")
    last_processed: Optional[datetime] = None
    
    # Timestamps
    upload_date: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

async def process_video_background(video_id: int):
    """Process video in the background."""
    # Create a new session for this background task
    db = SessionLocal()
    try:
        # Get the video
        video = db.query(VideoModel).get(video_id)
        if not video:
            logger.error(f"[Background Task] Video with ID {video_id} not found")
            return
        
        logger.info(f"[Background Task] Processing video ID: {video_id}, Title: {video.title}")
        
        # Update video status to processing
        video.processing_status = ProcessingStatus.PROCESSING
        db.commit()
        
        failed_stages = []
        
        # Step 1: Extract transcript
        try:
            # Check if transcript already exists
            transcript = db.query(TranscriptModel).filter(
                TranscriptModel.video_id == video_id,
                TranscriptModel.status == TranscriptStatus.PROCESSED
            ).first()
            
            if not transcript:
                logger.info(f"[Background Task] Extracting transcript for video ID: {video_id}")
                
                try:
                    # Extract transcript
                    transcript_service = TranscriptService()
                    transcript_text, meta = transcript_service.extract_transcript(video.webpage_url)
                    
                    # Create new transcript
                    transcript = TranscriptModel(
                        video_id=video_id,
                        content=transcript_text,
                        source_url=meta.get('source', 'unknown'),
                        status=TranscriptStatus.PROCESSED,
                        fetched_at=datetime.utcnow(),
                        processed_at=datetime.utcnow()
                    )
                    db.add(transcript)
                    db.commit()
                    db.refresh(transcript)
                    
                    logger.info(f"[Background Task] Transcript saved for video ID: {video_id}")
                except Exception as e:
                    logger.error(f"[Background Task] Error extracting transcript: {str(e)}", exc_info=True)
                    # Create a placeholder transcript to continue processing
                    transcript = TranscriptModel(
                        video_id=video_id,
                        content=f"[Failed to extract transcript: {str(e)}]",
                        source_url="error",
                        status=TranscriptStatus.PROCESSED,
                        fetched_at=datetime.utcnow(),
                        processed_at=datetime.utcnow(),
                        error_log={"error": str(e)}
                    )
                    db.add(transcript)
                    db.commit()
                    db.refresh(transcript)
                    
                    logger.info(f"[Background Task] Created placeholder transcript for video ID: {video_id}")
            else:
                logger.info(f"[Background Task] Using existing transcript for video ID: {video_id}")
        except Exception as e:
            logger.error(f"[Background Task] Error in transcript stage: {str(e)}", exc_info=True)
            failed_stages.append("transcript")
            # Continue to next stage
        
        # Step 2: Generate summary
        try:
            # Check if digest already exists
            digest = db.query(DigestModel).filter(DigestModel.video_id == video_id).first()
            
            if not digest:
                logger.info(f"[Background Task] Generating summary for video ID: {video_id}")
                
                # Get the transcript
                transcript = db.query(TranscriptModel).filter(
                    TranscriptModel.video_id == video_id,
                    TranscriptModel.status == TranscriptStatus.PROCESSED
                ).first()
                
                if not transcript:
                    logger.error(f"[Background Task] No transcript found for video ID: {video_id}")
                    raise ValueError("No transcript available for summary generation")
                
                # Generate summary
                summarizer = OpenAISummarizer()
                summary_result = summarizer.generate(transcript.content)
                
                # Create new digest
                digest = DigestModel(
                    video_id=video_id,
                    content=summary_result["summary"],
                    digest_type=DigestType.SUMMARY,
                    llm_id=91,  # Default GPT-4 model
                    user_id=1,  # Default user
                    tokens_used=summary_result["usage"].get("total_tokens", 0),
                    cost=summary_result["usage"].get("estimated_cost_usd", 0.0),
                    model_version="gpt-4-0125-preview",
                    generated_at=datetime.utcnow(),
                    extra_data=summary_result["usage"]
                )
                db.add(digest)
                db.commit()
                db.refresh(digest)
                
                logger.info(f"[Background Task] Summary saved for video ID: {video_id}")
            else:
                logger.info(f"[Background Task] Using existing summary for video ID: {video_id}")
        except Exception as e:
            logger.error(f"[Background Task] Error in summary stage: {str(e)}", exc_info=True)
            failed_stages.append("summary")
            # Continue to next stage
        
        # Update video status based on processing results
        try:
            # Refresh video from database to avoid stale data
            db.refresh(video)
            
            if not failed_stages:
                video.processing_status = ProcessingStatus.COMPLETED
                video.processed = True
                video.last_processed = datetime.utcnow()
                logger.info(f"[Background Task] Processing completed successfully for video ID: {video_id}")
            else:
                video.processing_status = ProcessingStatus.FAILED
                video.error_message = f"Failed stages: {', '.join(failed_stages)}"
                logger.error(f"[Background Task] Processing failed for video ID: {video_id}. Failed stages: {failed_stages}")
            
            db.commit()
        except Exception as e:
            logger.error(f"[Background Task] Error updating video status: {str(e)}", exc_info=True)
            # Try one more time with a new transaction
            try:
                db.rollback()
                video = db.query(VideoModel).get(video_id)
                if video:
                    video.processing_status = ProcessingStatus.FAILED if failed_stages else ProcessingStatus.COMPLETED
                    video.processed = not bool(failed_stages)
                    video.error_message = f"Failed stages: {', '.join(failed_stages)}" if failed_stages else None
                    video.last_processed = datetime.utcnow()
                    db.commit()
            except Exception as e2:
                logger.error(f"[Background Task] Final error updating video status: {str(e2)}", exc_info=True)
        
        logger.info(f"[Background Task] Processing completed for video ID: {video_id}. Failed stages: {failed_stages}")
        
    except Exception as e:
        logger.error(f"[Background Task] Unexpected error: {str(e)}", exc_info=True)
        try:
            # Try to update video status to failed
            video = db.query(VideoModel).get(video_id)
            if video:
                video.processing_status = ProcessingStatus.FAILED
                video.error_message = f"Unexpected error: {str(e)}"
                db.commit()
        except Exception as e2:
            logger.error(f"[Background Task] Error updating video status after exception: {str(e2)}", exc_info=True)
            db.rollback()
    finally:
        db.close()

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
        
        # Check if channel exists, create if not
        channel = db.query(ChannelModel).filter(
            ChannelModel.youtube_channel_id == video_info['channel_id']
        ).first()
        
        if not channel:
            logger.info(f"Creating new channel for {video_info['channel_title']}")
            channel = ChannelModel(
                youtube_channel_id=video_info['channel_id'],
                name=video_info['channel_title'],
                channel_url=f"https://www.youtube.com/channel/{video_info['channel_id']}",
                thumbnail_url=None,  # We don't have this from yt-dlp yet
                subscriber_count=video_info.get('subscriber_count'),
                last_updated=datetime.utcnow()
            )
            db.add(channel)
            db.commit()
            db.refresh(channel)
        
        # Check if video already exists
        existing_video = db.query(VideoModel).filter(
            VideoModel.youtube_id == video_info['youtube_id']
        ).first()
        
        if existing_video:
            logger.info(f"Video {video_info['youtube_id']} already exists, updating...")
            # Update existing video
            existing_video.title = video_info['title']
            existing_video.description = video_info.get('description', '')
            existing_video.duration = video_info['duration']
            existing_video.thumbnail = video_info.get('thumbnail_url')
            existing_video.view_count = video_info.get('view_count')
            existing_video.like_count = video_info.get('like_count')
            existing_video.tags = video_info.get('tags', [])
            existing_video.categories = video_info.get('categories', [])
            existing_video.chapters = video_info.get('chapters')
            existing_video.upload_date = video_info.get('upload_date')
            existing_video.channel_id = channel.id
            existing_video.processed = False  # Reset processed flag for re-processing
            existing_video.error_message = None
            existing_video.processing_status = ProcessingStatus.PENDING
            db_video = existing_video
        else:
            logger.info(f"Creating new video entry for {video_info['youtube_id']}")
            # Create new video entry
            db_video = VideoModel(
                youtube_id=video_info['youtube_id'],
                title=video_info['title'],
                webpage_url=str(video.url),
                thumbnail=video_info.get('thumbnail_url'),
                duration=video_info['duration'],
                view_count=video_info.get('view_count'),
                like_count=video_info.get('like_count'),
                description=video_info.get('description', ''),
                tags=video_info.get('tags', []),
                categories=video_info.get('categories', []),
                chapters=video_info.get('chapters'),
                channel_id=channel.id,
                upload_date=video_info.get('upload_date'),
                processed=False,
                error_message=None,
                processing_status=ProcessingStatus.PENDING
            )
            db.add(db_video)
            
        db.commit()
        db.refresh(db_video)
        
        # Map fields for API compatibility
        db_video.url = db_video.webpage_url
        db_video.thumbnail_url = db_video.thumbnail
        
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

@router.post("/videos/{video_id}/process", response_model=VideoResponse)
async def process_video(
    video_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Process a video to generate its summary."""
    try:
        video = db.query(VideoModel).filter(VideoModel.id == video_id).first()
        if not video:
            raise HTTPException(status_code=404, detail="Video not found")

        # Check if digest already exists
        existing_digest = db.query(DigestModel).filter(DigestModel.video_id == video_id).first()
        if existing_digest and existing_digest.content:
            logger.info(f"Using existing digest for video ID: {video_id}")
            # Map fields for API compatibility
            video.url = video.webpage_url
            video.thumbnail_url = video.thumbnail
            video.summary = existing_digest.content
            return video

        # Reset error state if retrying
        video.error_message = None
        video.processing_status = ProcessingStatus.PENDING
        db.commit()
        db.refresh(video)

        # Add background task
        background_tasks.add_task(process_video_background, video_id)
        
        # Map fields for API compatibility
        video.url = video.webpage_url
        video.thumbnail_url = video.thumbnail
        
        return video
        
    except Exception as e:
        logger.error(f"Error processing video: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/videos/", response_model=List[VideoResponse])
async def list_videos(
    skip: int = 0, 
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all videos with pagination"""
    try:
        videos = db.query(VideoModel).offset(skip).limit(limit).all()
        
        # Get all video IDs
        video_ids = [video.id for video in videos]
        
        # Get the latest digest for each video
        latest_digests = {}
        if video_ids:
            # Use a subquery to get the latest digest for each video_id
            from sqlalchemy import func
            
            # Get the maximum generated_at timestamp for each video_id
            latest_digest_times = db.query(
                DigestModel.video_id,
                func.max(DigestModel.generated_at).label('latest_time')
            ).filter(DigestModel.video_id.in_(video_ids)).group_by(DigestModel.video_id).subquery()
            
            # Join with the digests table to get the actual digest records
            latest_digest_query = db.query(DigestModel).join(
                latest_digest_times,
                (DigestModel.video_id == latest_digest_times.c.video_id) & 
                (DigestModel.generated_at == latest_digest_times.c.latest_time)
            )
            
            # Create a dictionary mapping video_id to digest
            for digest in latest_digest_query:
                latest_digests[digest.video_id] = digest
        
        # Map fields for API compatibility and add summaries
        for video in videos:
            video.url = video.webpage_url
            video.thumbnail_url = video.thumbnail
            
            # Add summary from the latest digest if available
            if video.id in latest_digests:
                video.summary = latest_digests[video.id].content
                
        return videos
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/videos/{video_id}", response_model=VideoResponse)
async def get_video(video_id: int, db: Session = Depends(get_db)):
    """Get a specific video"""
    try:
        video = db.query(VideoModel).filter(VideoModel.id == video_id).first()
        if not video:
            raise HTTPException(status_code=404, detail="Video not found")
        
        # Map fields for API compatibility
        video.url = video.webpage_url
        video.thumbnail_url = video.thumbnail
        
        # Get the latest digest for this video and set the summary
        latest_digest = db.query(DigestModel).filter(
            DigestModel.video_id == video_id
        ).order_by(DigestModel.generated_at.desc()).first()
        
        if latest_digest:
            # Map content to summary for API compatibility
            video.summary = latest_digest.content
            
        return video
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/videos/youtube/{youtube_id}", response_model=VideoResponse)
async def get_video_by_youtube_id(youtube_id: str, db: Session = Depends(get_db)):
    """Get a specific video by YouTube ID"""
    try:
        video = db.query(VideoModel).filter(VideoModel.youtube_id == youtube_id).first()
        if not video:
            raise HTTPException(status_code=404, detail="Video not found")
        
        # Map fields for API compatibility
        video.url = video.webpage_url
        video.thumbnail_url = video.thumbnail
        
        # Get the latest digest for this video and set the summary
        latest_digest = db.query(DigestModel).filter(
            DigestModel.video_id == video.id
        ).order_by(DigestModel.generated_at.desc()).first()
        
        if latest_digest:
            # Map content to summary for API compatibility
            video.summary = latest_digest.content
            
        return video
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/channels/{channel_id}/videos", response_model=List[VideoResponse])
async def get_channel_videos(
    channel_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all videos for a specific channel"""
    try:
        # Check if channel exists
        channel = db.query(ChannelModel).filter(ChannelModel.id == channel_id).first()
        if not channel:
            raise HTTPException(status_code=404, detail="Channel not found")
        
        # Get videos for channel
        videos = db.query(VideoModel).filter(
            VideoModel.channel_id == channel_id
        ).offset(skip).limit(limit).all()
        
        # Map fields for API compatibility
        for video in videos:
            video.url = video.webpage_url
            video.thumbnail_url = video.thumbnail
            
        return videos
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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
        # Get transcript if available
        transcript = db.query(TranscriptModel).filter(
            TranscriptModel.video_id == video_id,
            TranscriptModel.status == TranscriptStatus.PROCESSED
        ).first()
        
        # Extract transcript if not already present
        if not transcript:
            try:
                transcript_service = TranscriptService()
                transcript_text, meta = transcript_service.extract_transcript(video.webpage_url)
                
                # Create new transcript
                transcript = TranscriptModel(
                    video_id=video_id,
                    content=transcript_text,
                    source_url=meta.get('source', 'unknown'),
                    status=TranscriptStatus.PROCESSED,
                    fetched_at=datetime.utcnow(),
                    processed_at=datetime.utcnow()
                )
                db.add(transcript)
                db.commit()
                db.refresh(transcript)
                
                # Update video status
                video.processing_status = ProcessingStatus.SUMMARIZING
                db.commit()
                
                logger.info(f"Transcript saved and status set to SUMMARIZING for video ID: {video_id}")
            except Exception as e:
                logger.error(f"Error extracting transcript: {str(e)}", exc_info=True)
                # Create a placeholder transcript to continue processing
                transcript = TranscriptModel(
                    video_id=video_id,
                    content=f"[Failed to extract transcript: {str(e)}]",
                    source_url="error",
                    status=TranscriptStatus.PROCESSED,
                    fetched_at=datetime.utcnow(),
                    processed_at=datetime.utcnow(),
                    error_log={"error": str(e)}
                )
                db.add(transcript)
                db.commit()
                db.refresh(transcript)
                
                # Continue processing despite transcript error
                video.processing_status = ProcessingStatus.SUMMARIZING
                db.commit()
                logger.info(f"Created placeholder transcript and continuing for video ID: {video_id}")
        else:
            logger.info(f"Using existing transcript for video ID: {video_id}")
            video.processing_status = ProcessingStatus.SUMMARIZING
            db.commit()
            
        # Add background task for summary generation
        background_tasks.add_task(process_video_background, video_id)
        
        return {"message": "Summary generation started"}
        
    except Exception as e:
        logger.error(f"Error: {str(e)}", exc_info=True)
        video.error_message = str(e)
        video.processing_status = ProcessingStatus.FAILED
        db.commit()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/videos/debug/{url:path}")
async def debug_video_extraction(url: str):
    """Extract and return raw video info for debugging purposes."""
    try:
        processor = VideoProcessor()
        video_info = processor.validate_and_extract_info(url)
        return video_info
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
