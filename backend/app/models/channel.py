from sqlalchemy import Column, String, Integer, DateTime, Boolean, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .base import Base, TimestampMixin

class Channel(Base, TimestampMixin):
    """
    Stores YouTube channel information and metadata.
    Data is primarily sourced from yt-dlp with periodic updates.
    """
    __tablename__ = "channels"

    # Primary key and identifiers
    id = Column(Integer, primary_key=True, index=True)
    youtube_channel_id = Column(String(32), unique=True, nullable=False, index=True, 
                               comment="Standard format: UC + 22 chars")
    
    # Basic information
    name = Column(String(100), nullable=False, comment="Channel name")
    description = Column(Text, nullable=True, comment="Channel description")
    
    # URLs and media
    channel_url = Column(String(128), nullable=False, comment="Channel URL")
    thumbnail_url = Column(String(255), nullable=True, comment="Channel thumbnail URL")
    
    # Statistics
    subscriber_count = Column(Integer, nullable=True, comment="Number of subscribers")
    is_verified = Column(Boolean, nullable=True, comment="Channel verification status")
    
    # Additional identifiers
    uploader = Column(String(100), nullable=True, comment="Uploader name (same as channel name)")
    uploader_id = Column(String(100), nullable=True, comment="Uploader handle/ID (@handle format)")
    uploader_url = Column(String(128), nullable=True, comment="Uploader profile URL")
    
    # Additional data
    channel_metadata = Column(JSONB, nullable=True, comment="Additional channel metadata")
    last_updated = Column(DateTime(timezone=True), nullable=True, 
                         server_default=func.now(),
                         comment="Last metadata update timestamp")
    
    # Relationships
    videos = relationship("Video", back_populates="channel", cascade="all, delete-orphan")
    
    def __repr__(self):
        """String representation of the channel."""
        return f"<Channel(id={self.id}, name='{self.name}', youtube_id='{self.youtube_channel_id}')>"
