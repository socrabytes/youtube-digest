from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship

from .base import Base, TimestampMixin

class ProcessingLog(Base, TimestampMixin):
    __tablename__ = "processing_logs"

    # Primary key
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign keys
    video_id = Column(Integer, ForeignKey("videos.id", ondelete="CASCADE"), nullable=False)
    llm_id = Column(Integer, ForeignKey("llms.id"), nullable=False)
    
    # Processing information
    request_type = Column(String(50), nullable=False)
    tokens_used = Column(Integer, nullable=False)
    cost_estimate = Column(Float, nullable=False)
    
    # Relationships
    video = relationship("Video", back_populates="processing_logs")
    llm = relationship("LLM", back_populates="processing_logs")
