from sqlalchemy import Column, String, Integer, DateTime, Boolean
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .base import Base, TimestampMixin

class Channel(Base, TimestampMixin):
    __tablename__ = "channels"

    # Primary key and identifiers
    id = Column(Integer, primary_key=True, index=True)
    youtube_channel_id = Column(String(32), unique=True, nullable=False, index=True, comment="YouTube channel ID")
    
    # Basic information
    name = Column(String(100), nullable=False, comment="Channel name")
    description = Column(String(5000), nullable=True, comment="Channel description")
    thumbnail_url = Column(String(255), nullable=True, comment="Channel thumbnail URL")
    
    # Statistics
    subscriber_count = Column(Integer, nullable=True, comment="Number of subscribers")
    is_verified = Column(Boolean, nullable=True, comment="Channel verification status")
    
    # Additional identifiers
    uploader = Column(String(100), nullable=True, comment="Uploader name")
    uploader_id = Column(String(100), nullable=True, comment="Uploader handle/ID")
    uploader_url = Column(String(255), nullable=True, comment="Uploader URL")
    
    # Additional data
    channel_metadata = Column(JSONB, nullable=True, comment="Additional channel metadata")
    last_updated = Column(DateTime(timezone=True), nullable=True, comment="Last metadata update")
    
    # Relationships
    videos = relationship("Video", back_populates="channel", cascade="all, delete-orphan")
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
