from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from .base import Base, TimestampMixin

class Category(Base, TimestampMixin):
    """
    Reference table for YouTube video categories.
    Categories are stored as a JSONB array in the videos table,
    this table serves as a reference for valid category values.
    """
    __tablename__ = "categories"

    # Primary key
    id = Column(Integer, primary_key=True, index=True)
    
    # Category information
    youtube_category_id = Column(String(50), unique=True, nullable=False, index=True,
                                comment="Standard YouTube category ID")
    name = Column(String(100), nullable=False,
                 comment="Category name (e.g., 'Education', 'Technology')")
    description = Column(String(500), nullable=True,
                        comment="Optional category description")
    
    def __repr__(self):
        """String representation of the category."""
        return f"<Category(id={self.id}, name='{self.name}', youtube_id='{self.youtube_category_id}')>"
