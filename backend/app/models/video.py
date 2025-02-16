from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, BigInteger, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from enum import Enum

from .base import Base, TimestampMixin

class ProcessingStatus(str, Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    SUMMARIZING = "SUMMARIZING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class Video(Base, TimestampMixin):
    __tablename__ = "videos"

    # Primary key and identifiers
    id = Column(Integer, primary_key=True, index=True)
    youtube_id = Column(String(16), unique=True, nullable=True, index=True, comment="YouTube video ID")
    
    # Basic metadata
    title = Column(String(255), nullable=True, comment="Video title")
    description = Column(Text, nullable=True, comment="Video description")
    duration = Column(Integer, nullable=True, comment="Duration in seconds")
    upload_date = Column(String(8), nullable=True, comment="Upload date in YYYYMMDD format")
    
    # URLs
    webpage_url = Column(String(100), nullable=True, comment="YouTube video URL")
    thumbnail = Column(String(255), nullable=True, comment="Thumbnail URL")
    
    # Statistics
    view_count = Column(BigInteger, nullable=True, comment="Number of views")
    like_count = Column(Integer, nullable=True, comment="Number of likes")
    
    # Channel information (foreign key will be added once Channel model exists)
    channel_id = Column(Integer, ForeignKey('channels.id'), nullable=True, index=True)
    channel = relationship("Channel", back_populates="videos")
    
    # Rich content
    tags = Column(JSONB, nullable=True, comment="Array of video tags")
    categories = Column(JSONB, nullable=True, comment="Array of video categories")
    chapters = Column(JSONB, nullable=True, comment="Array of video chapters")
    
    # Content analysis
    transcript = Column(Text, nullable=True, comment="Video transcript")
    summary = Column(Text, nullable=True, comment="AI-generated summary")
    sentiment_score = Column(Integer, nullable=True, comment="Sentiment analysis score")
    
    # Processing metadata
    processing_status = Column(SQLEnum(ProcessingStatus), nullable=False, default=ProcessingStatus.PENDING)
    transcript_source = Column(String(10), nullable=True, comment="Source of transcript: manual or auto")
    openai_usage = Column(JSONB, nullable=True, comment="OpenAI API usage data")
    last_processed = Column(DateTime(timezone=True), nullable=True)
    processed = Column(Boolean, default=False, nullable=False)
    error_message = Column(Text, nullable=True)
    
    # Relationships
    channel = relationship("Channel", back_populates="videos")
    category = relationship("Category", back_populates="videos")
    transcript = relationship("Transcript", back_populates="video", uselist=False)
    digests = relationship("Digest", back_populates="video")
    processing_logs = relationship("ProcessingLog", back_populates="video")
    digest_interactions = relationship("DigestInteraction", back_populates="video")

    @property
    def is_processing(self) -> bool:
        return self.processing_status == ProcessingStatus.PROCESSING
    
    @property
    def is_processed(self) -> bool:
        return self.processing_status == ProcessingStatus.COMPLETED
    
    @property
    def has_failed(self) -> bool:
        return self.processing_status == ProcessingStatus.FAILED
