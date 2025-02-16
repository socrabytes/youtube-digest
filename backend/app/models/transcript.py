from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from enum import Enum

from .base import Base, TimestampMixin

class TranscriptStatus(str, Enum):
    PENDING = "pending"
    PROCESSED = "processed"
    FAILED = "failed"

class Transcript(Base, TimestampMixin):
    __tablename__ = "transcripts"

    # Primary key
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign keys
    video_id = Column(Integer, ForeignKey("videos.id", ondelete="CASCADE"), nullable=False)
    
    # Transcript data
    source_url = Column(String(500), nullable=False)
    content = Column(Text, nullable=True)
    status = Column(SQLEnum(TranscriptStatus), nullable=False, default=TranscriptStatus.PENDING)
    
    # Processing timestamps
    fetched_at = Column(DateTime(timezone=True), nullable=True)
    processed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Error tracking
    error_log = Column(JSONB, nullable=True)
    
    # Relationships
    video = relationship("Video", back_populates="transcript")
