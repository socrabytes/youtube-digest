from sqlalchemy import Column, Integer, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .base import Base

class UserDigest(Base):
    __tablename__ = "user_digests"

    # Primary key
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign keys
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    digest_id = Column(Integer, ForeignKey("digests.id", ondelete="CASCADE"), nullable=False)
    
    # Timestamp
    added_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="user_digests")
    digest = relationship("Digest", back_populates="user_digests")
