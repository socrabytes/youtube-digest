from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel, condecimal
from datetime import datetime

from app.db.database import get_db
from app.models.llm import LLM as LLMModel
from app.models.processing_log import ProcessingLog as ProcessingLogModel

router = APIRouter()

class LLMBase(BaseModel):
    name: str
    description: Optional[str] = None
    base_cost_per_token: condecimal(max_digits=10, decimal_places=8)

class LLMCreate(LLMBase):
    pass

class LLMResponse(LLMBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ProcessingLogBase(BaseModel):
    video_id: int
    llm_id: int
    request_type: str
    tokens_used: int
    cost_estimate: float
    input_tokens: Optional[int] = None
    output_tokens: Optional[int] = None
    duration_ms: Optional[int] = None
    started_at: datetime
    completed_at: Optional[datetime] = None
    error_details: Optional[dict] = None
    request_params: Optional[dict] = None
    response_metadata: Optional[dict] = None

class ProcessingLogCreate(ProcessingLogBase):
    pass

class ProcessingLogResponse(ProcessingLogBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

@router.get("/llms/", response_model=List[LLMResponse])
async def list_llms(db: Session = Depends(get_db)):
    """Get all LLM models"""
    try:
        return db.query(LLMModel).all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/llms/{llm_id}", response_model=LLMResponse)
async def get_llm(llm_id: int, db: Session = Depends(get_db)):
    """Get a specific LLM model"""
    try:
        llm = db.query(LLMModel).filter(LLMModel.id == llm_id).first()
        if llm is None:
            raise HTTPException(status_code=404, detail="LLM model not found")
        return llm
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/llms/", response_model=LLMResponse)
async def create_llm(llm: LLMCreate, db: Session = Depends(get_db)):
    """Create a new LLM model"""
    try:
        # Check if LLM with same name and cost already exists
        existing_llm = db.query(LLMModel).filter(
            (LLMModel.name == llm.name) & 
            (LLMModel.base_cost_per_token == llm.base_cost_per_token)
        ).first()
        
        if existing_llm:
            raise HTTPException(
                status_code=400, 
                detail=f"LLM model with name '{llm.name}' and same cost already exists"
            )
        
        # Create new LLM model
        db_llm = LLMModel(
            name=llm.name,
            description=llm.description,
            base_cost_per_token=llm.base_cost_per_token
        )
        
        db.add(db_llm)
        db.commit()
        db.refresh(db_llm)
        
        return db_llm
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/processing-logs/", response_model=List[ProcessingLogResponse])
async def list_processing_logs(db: Session = Depends(get_db)):
    """Get all processing logs"""
    try:
        return db.query(ProcessingLogModel).all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/processing-logs/{log_id}", response_model=ProcessingLogResponse)
async def get_processing_log(log_id: int, db: Session = Depends(get_db)):
    """Get a specific processing log"""
    try:
        log = db.query(ProcessingLogModel).filter(ProcessingLogModel.id == log_id).first()
        if log is None:
            raise HTTPException(status_code=404, detail="Processing log not found")
        return log
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/videos/{video_id}/processing-logs", response_model=List[ProcessingLogResponse])
async def get_video_processing_logs(video_id: int, db: Session = Depends(get_db)):
    """Get all processing logs for a specific video"""
    try:
        logs = db.query(ProcessingLogModel).filter(
            ProcessingLogModel.video_id == video_id
        ).all()
        return logs
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/processing-logs/", response_model=ProcessingLogResponse)
async def create_processing_log(log: ProcessingLogCreate, db: Session = Depends(get_db)):
    """Create a new processing log"""
    try:
        # Create new processing log
        db_log = ProcessingLogModel(
            video_id=log.video_id,
            llm_id=log.llm_id,
            request_type=log.request_type,
            tokens_used=log.tokens_used,
            cost_estimate=log.cost_estimate,
            input_tokens=log.input_tokens,
            output_tokens=log.output_tokens,
            duration_ms=log.duration_ms,
            started_at=log.started_at,
            completed_at=log.completed_at,
            error_details=log.error_details,
            request_params=log.request_params,
            response_metadata=log.response_metadata
        )
        
        db.add(db_log)
        db.commit()
        db.refresh(db_log)
        
        return db_log
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
