from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from datetime import datetime
import logging
from pydantic import BaseModel

from app.db.database import get_db, SessionLocal
from app.models.digest import Digest as DigestModel
from app.models.video import Video as VideoModel
from app.models.user import User as UserModel
from app.models.llm import LLM as LLMModel
from app.models.transcript import Transcript as TranscriptModel
from app.services.summarizers.openai_summarizer import OpenAISummarizer, SummaryGenerationError

logger = logging.getLogger(__name__)

router = APIRouter()

class DigestBase(BaseModel):
    video_id: int

class DigestCreate(DigestBase):
    user_id: Optional[int] = 1  # Default to user ID 1 if not provided
    digest_type: str = "summary"  # Default to summary type
    llm_id: Optional[int] = None

class DigestResponse(DigestBase):
    id: int
    digest: Optional[str] = None
    tokens_used: Optional[int] = None
    cost: Optional[float] = None
    model_version: Optional[str] = None
    generated_at: Optional[datetime] = None
    last_updated: Optional[datetime] = None
    extra_data: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime
    user_id: int
    digest_type: str
    llm_id: Optional[int] = None

    class Config:
        from_attributes = True

async def generate_digest_background(digest_id: int):
    """Background task for generating a digest."""
    db = SessionLocal()
    try:
        digest = db.query(DigestModel).filter(DigestModel.id == digest_id).first()
        if not digest:
            logger.error(f"Digest {digest_id} not found")
            return
            
        video = db.query(VideoModel).filter(VideoModel.id == digest.video_id).first()
        if not video:
            logger.error(f"Video {digest.video_id} not found")
            return
            
        # Get the transcript
        transcript = db.query(TranscriptModel).filter(
            TranscriptModel.video_id == video.id,
            TranscriptModel.status == "PROCESSED"
        ).first()
        
        if not transcript:
            logger.error(f"No transcript available for video {video.id}")
            digest.extra_data = {"error": "No transcript available"}
            db.commit()
            return
            
        try:
            # Get the default LLM if not specified
            if not digest.llm_id:
                default_llm = db.query(LLMModel).first()
                if default_llm:
                    digest.llm_id = default_llm.id
                else:
                    logger.error("No LLM models found in database")
                    digest.extra_data = {"error": "No LLM models available"}
                    db.commit()
                    return
            
            # Generate the digest
            summarizer = OpenAISummarizer()
            result = summarizer.generate(transcript.content)
            
            # Update the digest
            digest.digest = result["summary"]
            digest.tokens_used = result["usage"]["total_tokens"]
            digest.cost = result["usage"]["estimated_cost_usd"]
            digest.model_version = "gpt-4-0125-preview"  # This should come from the summarizer
            digest.generated_at = datetime.utcnow()
            digest.extra_data = result["usage"]
            
            db.commit()
            logger.info(f"Successfully generated digest {digest_id}")
            
        except SummaryGenerationError as e:
            logger.error(f"Error generating digest: {str(e)}")
            digest.extra_data = {"error": str(e)}
            db.commit()
            
    except Exception as e:
        logger.error(f"Unexpected error in digest generation: {str(e)}", exc_info=True)
    finally:
        db.close()

@router.get("/digests/", response_model=List[DigestResponse])
async def list_digests(video_id: Optional[int] = None, db: Session = Depends(get_db)):
    """Get all digests or filter by video_id if provided"""
    try:
        query = db.query(DigestModel)
        
        if video_id is not None:
            query = query.filter(DigestModel.video_id == video_id)
            
        return query.all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/digests/{digest_id}", response_model=DigestResponse)
async def get_digest(digest_id: int, db: Session = Depends(get_db)):
    """Get a specific digest"""
    try:
        digest = db.query(DigestModel).filter(DigestModel.id == digest_id).first()
        if digest is None:
            raise HTTPException(status_code=404, detail="Digest not found")
        return digest
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/videos/{video_id}/digests", response_model=List[DigestResponse])
async def get_video_digests(video_id: int, db: Session = Depends(get_db)):
    """Get all digests for a specific video"""
    try:
        video = db.query(VideoModel).filter(VideoModel.id == video_id).first()
        if video is None:
            raise HTTPException(status_code=404, detail="Video not found")
            
        digests = db.query(DigestModel).filter(
            DigestModel.video_id == video_id
        ).all()
        
        return digests
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/users/{user_id}/digests", response_model=List[DigestResponse])
async def get_user_digests(user_id: int, db: Session = Depends(get_db)):
    """Get all digests created by a specific user"""
    try:
        user = db.query(UserModel).filter(UserModel.id == user_id).first()
        if user is None:
            raise HTTPException(status_code=404, detail="User not found")
            
        digests = db.query(DigestModel).filter(
            DigestModel.user_id == user_id
        ).all()
        
        return digests
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/digests/", response_model=DigestResponse)
async def create_digest(
    digest: DigestCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Create a new digest for a video"""
    try:
        # Check if video exists
        video = db.query(VideoModel).filter(VideoModel.id == digest.video_id).first()
        if video is None:
            raise HTTPException(status_code=404, detail="Video not found")
        
        # Check if digest already exists for this video
        existing_digest = db.query(DigestModel).filter(
            DigestModel.video_id == digest.video_id,
            DigestModel.digest_type == digest.digest_type
        ).first()
        
        if existing_digest and existing_digest.digest:
            logger.info(f"Using existing digest for video ID: {digest.video_id}")
            return existing_digest
        
        # Check if user exists
        user = db.query(UserModel).filter(UserModel.id == digest.user_id).first()
        if user is None:
            # Create a default user if none exists
            default_user = UserModel(
                id=1,
                username="default_user",
                email="default@example.com"
            )
            db.add(default_user)
            db.commit()
            db.refresh(default_user)
            user = default_user
        
        # Get the default LLM if not specified
        if not digest.llm_id:
            default_llm = db.query(LLMModel).first()
            if default_llm:
                digest.llm_id = default_llm.id
            else:
                # Create a default LLM if none exists
                default_llm = LLMModel(
                    name="gpt-4-0125-preview",
                    base_cost_per_token=0.00001,
                    description="OpenAI GPT-4 model"
                )
                db.add(default_llm)
                db.commit()
                db.refresh(default_llm)
                digest.llm_id = default_llm.id
        
        # If we have an existing digest but it's empty, update it instead of creating a new one
        if existing_digest:
            logger.info(f"Updating existing empty digest for video ID: {digest.video_id}")
            # Start background task to generate digest
            background_tasks.add_task(generate_digest_background, existing_digest.id)
            return existing_digest
        
        # Create new digest
        db_digest = DigestModel(
            video_id=digest.video_id,
            user_id=digest.user_id,
            digest_type=digest.digest_type,
            llm_id=digest.llm_id,
            digest="",  # Empty digest initially
            tokens_used=0,
            cost=0.0,
            model_version="pending",
            generated_at=datetime.utcnow()  # Set generated_at to current time
        )
        
        db.add(db_digest)
        db.commit()
        db.refresh(db_digest)
        
        # Start background task to generate digest
        background_tasks.add_task(generate_digest_background, db_digest.id)
        
        return db_digest
    except Exception as e:
        logger.error(f"Error creating digest: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/videos/{video_id}/digests", response_model=DigestResponse)
async def create_video_digest(
    video_id: int,
    digest_create: DigestCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Create a new digest for a video"""
    try:
        # Validate video exists
        video = db.query(VideoModel).filter(VideoModel.id == video_id).first()
        if video is None:
            raise HTTPException(status_code=404, detail="Video not found")
            
        # Validate user exists
        user = db.query(UserModel).filter(UserModel.id == digest_create.user_id).first()
        if user is None:
            # Create a default user if none exists
            default_user = UserModel(
                id=1,
                username="default_user",
                email="default@example.com"
            )
            db.add(default_user)
            db.commit()
            db.refresh(default_user)
            user = default_user
            
        # Validate LLM exists if provided
        if digest_create.llm_id:
            llm = db.query(LLMModel).filter(LLMModel.id == digest_create.llm_id).first()
            if llm is None:
                raise HTTPException(status_code=404, detail="LLM not found")
        else:
            # Get the default LLM if not specified
            default_llm = db.query(LLMModel).first()
            if default_llm:
                digest_create.llm_id = default_llm.id
            else:
                # Create a default LLM if none exists
                default_llm = LLMModel(
                    name="gpt-4-0125-preview",
                    base_cost_per_token=0.00001,
                    description="OpenAI GPT-4 model"
                )
                db.add(default_llm)
                db.commit()
                db.refresh(default_llm)
                digest_create.llm_id = default_llm.id
        
        # Create digest
        digest = DigestModel(
            video_id=video_id,
            user_id=digest_create.user_id,
            digest_type=digest_create.digest_type,
            llm_id=digest_create.llm_id,
            digest="",  # Empty digest initially
            tokens_used=0,
            cost=0.0,
            model_version="pending",
            generated_at=datetime.utcnow()  # Set generated_at to current time
        )
        
        db.add(digest)
        db.commit()
        db.refresh(digest)
        
        # Start background processing
        background_tasks.add_task(generate_digest_background, digest.id)
        
        return digest
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
