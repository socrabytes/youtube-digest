from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime

from app.db.database import get_db, SessionLocal
from app.models.transcript import Transcript as TranscriptModel
from app.models.video import Video as VideoModel
from app.services.transcript_service import TranscriptService, VideoTranscriptError

import logging
logger = logging.getLogger(__name__)

router = APIRouter()

class TranscriptBase(BaseModel):
    video_id: int
    source_url: Optional[str] = None
    content: Optional[str] = None
    status: Optional[str] = None

class TranscriptCreate(TranscriptBase):
    pass

class TranscriptResponse(TranscriptBase):
    id: int
    fetched_at: Optional[datetime] = None
    processed_at: Optional[datetime] = None
    error_log: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

async def process_transcript_background(video_id: int, transcript_id: int):
    """Background task for processing a transcript."""
    db = SessionLocal()
    try:
        video = db.query(VideoModel).filter(VideoModel.id == video_id).first()
        transcript = db.query(TranscriptModel).filter(TranscriptModel.id == transcript_id).first()
        
        if not video or not transcript:
            logger.error(f"Video {video_id} or transcript {transcript_id} not found")
            return
            
        try:
            transcript_service = TranscriptService()
            transcript_text, transcript_info = transcript_service.extract_transcript(video.url)
            
            transcript.content = transcript_text
            transcript.source_url = transcript_info.get('source')
            transcript.status = "processed"
            transcript.processed_at = datetime.utcnow()
            transcript.error_log = None
            db.commit()
            
            logger.info(f"Successfully processed transcript {transcript_id} for video {video_id}")
            
        except VideoTranscriptError as e:
            logger.error(f"Error processing transcript: {str(e)}")
            transcript.status = "failed"
            transcript.error_log = {"error": str(e)}
            db.commit()
            
    except Exception as e:
        logger.error(f"Unexpected error in transcript processing: {str(e)}", exc_info=True)
    finally:
        db.close()

@router.get("/transcripts/", response_model=List[TranscriptResponse])
async def list_transcripts(db: Session = Depends(get_db)):
    """Get all transcripts"""
    try:
        return db.query(TranscriptModel).all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/transcripts/{transcript_id}", response_model=TranscriptResponse)
async def get_transcript(transcript_id: int, db: Session = Depends(get_db)):
    """Get a specific transcript"""
    try:
        transcript = db.query(TranscriptModel).filter(TranscriptModel.id == transcript_id).first()
        if transcript is None:
            raise HTTPException(status_code=404, detail="Transcript not found")
        return transcript
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/videos/{video_id}/transcripts", response_model=List[TranscriptResponse])
async def get_video_transcripts(video_id: int, db: Session = Depends(get_db)):
    """Get all transcripts for a specific video"""
    try:
        video = db.query(VideoModel).filter(VideoModel.id == video_id).first()
        if video is None:
            raise HTTPException(status_code=404, detail="Video not found")
            
        transcripts = db.query(TranscriptModel).filter(
            TranscriptModel.video_id == video_id
        ).all()
        
        return transcripts
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/videos/{video_id}/transcripts", response_model=TranscriptResponse)
async def create_transcript(
    video_id: int, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Create a new transcript for a video"""
    try:
        video = db.query(VideoModel).filter(VideoModel.id == video_id).first()
        if video is None:
            raise HTTPException(status_code=404, detail="Video not found")
            
        # Create a new transcript entry
        transcript = TranscriptModel(
            video_id=video_id,
            status="pending"
        )
        
        db.add(transcript)
        db.commit()
        db.refresh(transcript)
        
        # Start background processing
        background_tasks.add_task(process_transcript_background, video_id, transcript.id)
        
        return transcript
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
