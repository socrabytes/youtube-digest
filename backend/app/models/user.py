from sqlalchemy import Column, Integer, String, select, func
from sqlalchemy.orm import relationship
import re

from .base import Base, TimestampMixin

class User(Base, TimestampMixin):
    """
    Stores user information and manages relationships with digests.
    Users can create, save, and interact with video digests.
    """
    __tablename__ = "users"

    # Primary key
    id = Column(Integer, primary_key=True, index=True)
    
    # User information
    username = Column(String(50), unique=True, nullable=False, index=True,
                     comment="Unique username for the user")
    email = Column(String(255), unique=True, nullable=False, index=True,
                  comment="User's email address")
    
    # Relationships
    digests = relationship("Digest", back_populates="user",
                          cascade="all, delete-orphan")
    user_digests = relationship("UserDigest", back_populates="user",
                               cascade="all, delete-orphan")
    digest_interactions = relationship("DigestInteraction", back_populates="user",
                                     cascade="all, delete-orphan")
    
    def __repr__(self):
        """String representation of the user."""
        return f"<User(id={self.id}, username='{self.username}')>"
    
    @property
    def digest_count(self) -> int:
        """Get the number of digests created by this user."""
        return len(self.digests)
    
    @property
    def saved_digest_count(self) -> int:
        """Get the number of digests saved by this user."""
        return len(self.user_digests)
    
    @staticmethod
    def validate_username(username: str) -> bool:
        """
        Validate username format.
        Must be 3-50 characters, alphanumeric with underscores and hyphens.
        """
        pattern = r'^[a-zA-Z0-9_-]{3,50}$'
        return bool(re.match(pattern, username))
    
    @staticmethod
    def validate_email(email: str) -> bool:
        """
        Validate email format.
        Basic email validation, for more thorough validation consider using a library.
        """
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(pattern, email))
