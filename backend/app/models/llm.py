from sqlalchemy import Column, Integer, String, Numeric
from sqlalchemy.orm import relationship

from .base import Base, TimestampMixin

class LLM(Base, TimestampMixin):
    __tablename__ = "llms"

    # Primary key
    id = Column(Integer, primary_key=True, index=True)
    
    # LLM information
    name = Column(String(100), nullable=False)
    description = Column(String(500), nullable=True)
    base_cost_per_token = Column(Numeric(10, 8), nullable=False)
    
    # Relationships
    digests = relationship("Digest", back_populates="llm")
    processing_logs = relationship("ProcessingLog", back_populates="llm")
