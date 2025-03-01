from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, BigInteger, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from enum import Enum
from datetime import datetime

from .base import Base, TimestampMixin

class ProcessingStatus(str, Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class Video(Base, TimestampMixin):
    """
    Central table storing video metadata extracted via yt-dlp.
    Contains core video information and relationships to other entities.
    """
    __tablename__ = "videos"

    # Primary key and identifiers
    id = Column(Integer, primary_key=True, index=True)
    youtube_id = Column(String(16), unique=True, nullable=False, index=True, 
                       comment="Unique YouTube video ID")

    # Basic metadata
    title = Column(String(255), nullable=False, comment="Video title")
    description = Column(Text, nullable=True, comment="Video description text")
    duration = Column(Integer, nullable=True, comment="Duration in seconds")
    upload_date = Column(String(8), nullable=True, comment="Upload date in YYYYMMDD format")
    
    # URLs and media
    webpage_url = Column(String(100), nullable=False, comment="YouTube video URL")
    thumbnail = Column(String(255), nullable=True, comment="Video thumbnail URL")
    
    # Statistics (updated periodically)
    view_count = Column(BigInteger, nullable=True, comment="Current view count from YouTube")
    like_count = Column(Integer, nullable=True, comment="Current like count from YouTube")
    
    # Rich content (stored as JSONB for flexibility)
    tags = Column(JSONB, nullable=True, comment="Array of video tags")
    categories = Column(JSONB, nullable=True, comment="Array of video categories")
    chapters = Column(JSONB, nullable=True, comment="Array of video chapters")
    
    # AI-generated content
    summary = Column(Text, nullable=True, comment="AI-generated summary")
    sentiment_score = Column(Integer, nullable=True, comment="Sentiment analysis score")
    
    # Processing metadata
    processing_status = Column(SQLEnum(ProcessingStatus), nullable=False, 
                             default=ProcessingStatus.PENDING,
                             comment="Current state of video processing")
    processed = Column(Boolean, default=False, nullable=False,
                      comment="Processing completion flag")
    error_message = Column(Text, nullable=True, 
                          comment="Error details if processing failed")
    last_processed = Column(DateTime(timezone=True), nullable=True,
                           comment="Last processing attempt")
    
    # Foreign Keys
    channel_id = Column(Integer, ForeignKey('channels.id', ondelete='CASCADE'),
                       nullable=False, index=True,
                       comment="Associated channel")

    # Relationships
    channel = relationship("Channel", back_populates="videos")
    transcripts = relationship("Transcript", back_populates="video",
                             cascade="all, delete-orphan")
    digests = relationship("Digest", back_populates="video",
                          cascade="all, delete-orphan")
    processing_logs = relationship("ProcessingLog", back_populates="video",
                                 cascade="all, delete-orphan")
    digest_interactions = relationship("DigestInteraction", back_populates="video",
                                     cascade="all, delete-orphan")

    @property
    def is_processing(self) -> bool:
        """Check if video is currently being processed."""
        return self.processing_status == ProcessingStatus.PROCESSING
    
    @property
    def is_processed(self) -> bool:
        """Check if video processing is completed."""
        return self.processing_status == ProcessingStatus.COMPLETED
    
    @property
    def has_failed(self) -> bool:
        """Check if video processing has failed."""
        return self.processing_status == ProcessingStatus.FAILED
