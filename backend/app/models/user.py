from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from .base import Base, TimestampMixin

class User(Base, TimestampMixin):
    __tablename__ = "users"

    # Primary key
    id = Column(Integer, primary_key=True, index=True)
    
    # User information
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    
    # Relationships
    digests = relationship("Digest", back_populates="user")
    user_digests = relationship("UserDigest", back_populates="user")
    digest_interactions = relationship("DigestInteraction", back_populates="user")
