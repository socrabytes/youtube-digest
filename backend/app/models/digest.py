from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship

from .base import Base, TimestampMixin

class Digest(Base, TimestampMixin):
    __tablename__ = "digests"

    # Primary key
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign keys
    video_id = Column(Integer, ForeignKey("videos.id", ondelete="CASCADE"), nullable=False)
    llm_id = Column(Integer, ForeignKey("llms.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Digest content
    digest = Column(Text, nullable=False)
    digest_type = Column(String(50), nullable=False)  # e.g., highlights, chapters, detailed
    
    # Processing metadata
    tokens_used = Column(Integer, nullable=False)
    cost = Column(Float, nullable=False)
    model_version = Column(String(50), nullable=False)
    
    # Timestamps
    generated_at = Column(DateTime(timezone=True), nullable=False)
    last_updated = Column(DateTime(timezone=True), nullable=True)
    
    # Additional data
    extra_data = Column(JSONB, nullable=True)  # e.g., chapter timestamps
    
    # Relationships
    video = relationship("Video", back_populates="digests")
    llm = relationship("LLM", back_populates="digests")
    user = relationship("User", back_populates="digests")
    user_digests = relationship("UserDigest", back_populates="digest")
    digest_interactions = relationship("DigestInteraction", back_populates="digest")
