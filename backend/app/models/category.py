from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from .base import Base, TimestampMixin

class Category(Base, TimestampMixin):
    __tablename__ = "categories"

    # Primary key
    id = Column(Integer, primary_key=True, index=True)
    
    # Category information
    youtube_category_id = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    description = Column(String(500), nullable=True)
    
    # Relationships
    videos = relationship("Video", back_populates="category")
