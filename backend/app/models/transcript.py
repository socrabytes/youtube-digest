from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from enum import Enum

from .base import Base, TimestampMixin

class TranscriptStatus(str, Enum):
    """Status of transcript processing."""
    PENDING = "PENDING"
    PROCESSED = "PROCESSED"
    FAILED = "FAILED"

class Transcript(Base, TimestampMixin):
    """
    Stores video transcripts and their processing status.
    Each video can have multiple transcripts from different sources.
    """
    __tablename__ = "transcripts"

    # Primary key
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign keys
    video_id = Column(Integer, ForeignKey("videos.id", ondelete="CASCADE"), 
                     nullable=False, index=True,
                     comment="Associated video")
    
    # Transcript data
    source_url = Column(String(500), nullable=False,
                       comment="URL where transcript was obtained")
    content = Column(Text, nullable=True,
                    comment="Full transcript text content")
    status = Column(SQLEnum(TranscriptStatus), nullable=False, 
                   default=TranscriptStatus.PENDING,
                   comment="Current processing status")
    
    # Processing timestamps
    fetched_at = Column(DateTime(timezone=True), nullable=True,
                       comment="When transcript was retrieved")
    processed_at = Column(DateTime(timezone=True), nullable=True,
                         comment="When processing completed")
    
    # Error tracking
    error_log = Column(JSONB, nullable=True,
                      comment="Processing errors and details")
    
    # Relationships
    video = relationship("Video", back_populates="transcripts")
    
    def __repr__(self):
        """String representation of the transcript."""
        return f"<Transcript(id={self.id}, video_id={self.video_id}, status='{self.status}')>"
    
    @property
    def is_processed(self) -> bool:
        """Check if transcript has been processed."""
        return self.status == TranscriptStatus.PROCESSED
    
    @property
    def has_failed(self) -> bool:
        """Check if transcript processing failed."""
        return self.status == TranscriptStatus.FAILED
