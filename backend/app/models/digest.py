from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from enum import Enum

from .base import Base, TimestampMixin

class DigestType(str, Enum):
    """Types of digests that can be generated."""
    HIGHLIGHTS = "highlights"
    CHAPTERS = "chapters"
    DETAILED = "detailed"
    SUMMARY = "summary"

class Digest(Base, TimestampMixin):
    """
    Stores AI-generated video digests.
    Each digest represents a different way of summarizing or presenting video content,
    generated using various LLM models.
    """
    __tablename__ = "digests"

    # Primary key
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign keys
    video_id = Column(Integer, ForeignKey("videos.id", ondelete="CASCADE"), 
                     nullable=False, index=True,
                     comment="Associated video")
    llm_id = Column(Integer, ForeignKey("llms.id"), 
                   nullable=False, index=True,
                   comment="LLM model used for generation")
    user_id = Column(Integer, ForeignKey("users.id"), 
                    nullable=False, index=True,
                    comment="User who requested the digest")
    
    # Digest content
    content = Column(Text, nullable=False,
                   comment="The actual digest text content")
    digest_type = Column(SQLEnum(DigestType), nullable=False,
                        comment="Type of digest generated")
    
    # Processing metadata
    tokens_used = Column(Integer, nullable=False,
                        comment="Number of tokens consumed by LLM")
    cost = Column(Float, nullable=False,
                 comment="Cost of generation in USD")
    model_version = Column(String(50), nullable=False,
                          comment="Specific version of LLM used")
    
    # Timestamps
    generated_at = Column(DateTime(timezone=True), nullable=False,
                         comment="When digest was created")
    last_updated = Column(DateTime(timezone=True), nullable=True,
                         comment="Last modification time")
    
    # Additional data
    extra_data = Column(JSONB, nullable=True,
                       comment="Additional metadata (e.g., chapter timestamps)")
    
    # Relationships
    video = relationship("Video", back_populates="digests")
    llm = relationship("LLM", back_populates="digests")
    user = relationship("User", back_populates="digests")
    user_digests = relationship("UserDigest", back_populates="digest",
                              cascade="all, delete-orphan")
    digest_interactions = relationship("DigestInteraction", back_populates="digest",
                                     cascade="all, delete-orphan")
    
    def __repr__(self):
        """String representation of the digest."""
        return f"<Digest(id={self.id}, type='{self.digest_type}', video_id={self.video_id})>"
    
    @property
    def token_cost(self) -> float:
        """Calculate the cost per token."""
        return self.cost / self.tokens_used if self.tokens_used > 0 else 0
