from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
from enum import Enum
from sqlalchemy.sql import func

from .base import Base, TimestampMixin

class ActionType(str, Enum):
    """Types of interactions a user can have with a digest."""
    SKIPPED = "skipped"  # User explicitly skipped the digest
    WATCHED = "watched"  # User watched/read the digest
    SAVED = "saved"     # User saved the digest for later
    SHARED = "shared"   # User shared the digest

class DigestInteraction(Base, TimestampMixin):
    """
    Tracks user interactions with digests.
    Used for analytics and personalization of digest recommendations.
    """
    __tablename__ = "digest_interactions"

    # Primary key
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign keys
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), 
                    nullable=False, index=True,
                    comment="User who performed the action")
    digest_id = Column(Integer, ForeignKey("digests.id", ondelete="CASCADE"), 
                      nullable=False, index=True,
                      comment="Digest being interacted with")
    video_id = Column(Integer, ForeignKey("videos.id", ondelete="CASCADE"), 
                     nullable=False, index=True,
                     comment="Video associated with the digest")
    
    # Interaction data
    action = Column(SQLEnum(ActionType), nullable=False,
                   comment="Type of interaction (watched, skipped, etc.)")
    action_at = Column(DateTime(timezone=True), server_default=func.now(), 
                      nullable=False, index=True,
                      comment="When the interaction occurred")
    
    # Relationships
    user = relationship("User", back_populates="digest_interactions")
    digest = relationship("Digest", back_populates="digest_interactions")
    video = relationship("Video", back_populates="digest_interactions")
    
    def __repr__(self):
        """String representation of the interaction."""
        return f"<DigestInteraction(id={self.id}, user='{self.user_id}', action='{self.action}')>"
    
    @property
    def is_positive_interaction(self) -> bool:
        """Check if this is a positive interaction (watched/saved/shared)."""
        return self.action in [ActionType.WATCHED, ActionType.SAVED, ActionType.SHARED]
    
    @property
    def interaction_age(self) -> float:
        """Get the age of the interaction in hours."""
        if not self.action_at:
            return 0.0
        delta = func.now() - self.action_at
        return delta.total_seconds() / 3600
    
    @classmethod
    def get_user_interaction_stats(cls, session, user_id: int) -> dict:
        """Get interaction statistics for a user."""
        stats = session.query(
            cls.action,
            func.count(cls.id).label('count')
        ).filter(
            cls.user_id == user_id
        ).group_by(
            cls.action
        ).all()
        
        return {action: count for action, count in stats}
