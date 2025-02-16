from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
from enum import Enum
from sqlalchemy.sql import func

from .base import Base

class ActionType(str, Enum):
    SKIPPED = "skipped"
    WATCHED = "watched"

class DigestInteraction(Base):
    __tablename__ = "digest_interactions"

    # Primary key
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign keys
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    digest_id = Column(Integer, ForeignKey("digests.id", ondelete="CASCADE"), nullable=False)
    video_id = Column(Integer, ForeignKey("videos.id", ondelete="CASCADE"), nullable=False)
    
    # Interaction data
    action = Column(SQLEnum(ActionType), nullable=False)
    action_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="digest_interactions")
    digest = relationship("Digest", back_populates="digest_interactions")
    video = relationship("Video", back_populates="digest_interactions")
