from sqlalchemy import Column, Integer, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .base import Base, TimestampMixin

class UserDigest(Base, TimestampMixin):
    """
    Maps users to their saved digests.
    Enables users to build a personal library of digests for later reference.
    """
    __tablename__ = "user_digests"
    __table_args__ = (
        UniqueConstraint('user_id', 'digest_id', name='uq_user_digest'),
    )

    # Primary key
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign keys
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), 
                    nullable=False, index=True,
                    comment="User who saved the digest")
    digest_id = Column(Integer, ForeignKey("digests.id", ondelete="CASCADE"), 
                      nullable=False, index=True,
                      comment="Digest that was saved")
    
    # Timestamp
    added_at = Column(DateTime(timezone=True), server_default=func.now(), 
                     nullable=False, index=True,
                     comment="When the digest was saved")
    
    # Relationships
    user = relationship("User", back_populates="user_digests")
    digest = relationship("Digest", back_populates="user_digests")
    
    def __repr__(self):
        """String representation of the user digest."""
        return f"<UserDigest(id={self.id}, user='{self.user_id}', digest='{self.digest_id}')>"
    
    @property
    def age_in_library(self) -> float:
        """Get how long the digest has been in the user's library (in days)."""
        if not self.added_at:
            return 0.0
        delta = func.now() - self.added_at
        return delta.total_seconds() / (24 * 3600)
    
    @classmethod
    def get_user_library_stats(cls, session, user_id: int) -> dict:
        """Get statistics about a user's digest library."""
        total_saved = session.query(func.count(cls.id)).filter(
            cls.user_id == user_id
        ).scalar()
        
        oldest_save = session.query(func.min(cls.added_at)).filter(
            cls.user_id == user_id
        ).scalar()
        
        newest_save = session.query(func.max(cls.added_at)).filter(
            cls.user_id == user_id
        ).scalar()
        
        return {
            'total_saved': total_saved or 0,
            'oldest_save': oldest_save,
            'newest_save': newest_save,
            'library_age_days': (newest_save - oldest_save).days if newest_save and oldest_save else 0
        }
