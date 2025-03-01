from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.db.database import get_db
from app.models.channel import Channel as ChannelModel

router = APIRouter()

class ChannelBase(BaseModel):
    youtube_channel_id: str
    name: str
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    subscriber_count: Optional[int] = None
    is_verified: Optional[bool] = None
    uploader: Optional[str] = None
    uploader_id: Optional[str] = None
    uploader_url: Optional[str] = None
    channel_metadata: Optional[dict] = None

class ChannelCreate(ChannelBase):
    pass

class ChannelResponse(ChannelBase):
    id: int
    last_updated: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

@router.get("/channels/", response_model=List[ChannelResponse])
async def list_channels(db: Session = Depends(get_db)):
    """Get all channels"""
    try:
        return db.query(ChannelModel).all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/channels/{channel_id}", response_model=ChannelResponse)
async def get_channel(channel_id: int, db: Session = Depends(get_db)):
    """Get a specific channel"""
    try:
        channel = db.query(ChannelModel).filter(ChannelModel.id == channel_id).first()
        if channel is None:
            raise HTTPException(status_code=404, detail="Channel not found")
        return channel
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/channels/youtube/{youtube_channel_id}", response_model=ChannelResponse)
async def get_channel_by_youtube_id(youtube_channel_id: str, db: Session = Depends(get_db)):
    """Get a specific channel by YouTube channel ID"""
    try:
        channel = db.query(ChannelModel).filter(
            ChannelModel.youtube_channel_id == youtube_channel_id
        ).first()
        if channel is None:
            raise HTTPException(status_code=404, detail="Channel not found")
        return channel
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
