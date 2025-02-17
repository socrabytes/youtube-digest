from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from enum import Enum

from .base import Base, TimestampMixin

class RequestType(str, Enum):
    """Types of LLM requests that can be made."""
    SUMMARIZE = "summarize"
    ANALYZE_SENTIMENT = "analyze_sentiment"
    GENERATE_CHAPTERS = "generate_chapters"
    EXTRACT_HIGHLIGHTS = "extract_highlights"
    CUSTOM = "custom"

class ProcessingLog(Base, TimestampMixin):
    """
    Tracks all LLM processing requests and their outcomes.
    Used for monitoring costs, usage patterns, and debugging issues.
    """
    __tablename__ = "processing_logs"

    # Primary key
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign keys
    video_id = Column(Integer, ForeignKey("videos.id", ondelete="CASCADE"), 
                     nullable=False, index=True,
                     comment="Associated video")
    llm_id = Column(Integer, ForeignKey("llms.id"), 
                   nullable=False, index=True,
                   comment="LLM model used")
    
    # Processing information
    request_type = Column(SQLEnum(RequestType), nullable=False,
                         comment="Type of processing request")
    tokens_used = Column(Integer, nullable=False,
                        comment="Number of tokens consumed")
    cost_estimate = Column(Float, nullable=False,
                          comment="Estimated cost in USD")
    
    # Request details
    input_tokens = Column(Integer, nullable=True,
                         comment="Number of input tokens")
    output_tokens = Column(Integer, nullable=True,
                         comment="Number of output tokens")
    duration_ms = Column(Integer, nullable=True,
                        comment="Processing duration in milliseconds")
    
    # Status tracking
    started_at = Column(DateTime(timezone=True), nullable=False,
                       comment="When processing started")
    completed_at = Column(DateTime(timezone=True), nullable=True,
                         comment="When processing finished")
    error_details = Column(JSONB, nullable=True,
                          comment="Error information if failed")
    
    # Request metadata
    request_params = Column(JSONB, nullable=True,
                           comment="Parameters used in the request")
    response_metadata = Column(JSONB, nullable=True,
                             comment="Metadata from the response")
    
    # Relationships
    video = relationship("Video", back_populates="processing_logs")
    llm = relationship("LLM", back_populates="processing_logs")
    
    def __repr__(self):
        """String representation of the processing log."""
        return f"<ProcessingLog(id={self.id}, type='{self.request_type}', tokens={self.tokens_used})>"
    
    @property
    def duration_seconds(self) -> float:
        """Get processing duration in seconds."""
        return self.duration_ms / 1000 if self.duration_ms else 0
    
    @property
    def has_error(self) -> bool:
        """Check if processing encountered an error."""
        return bool(self.error_details)
    
    @property
    def cost_per_token(self) -> float:
        """Calculate the cost per token for this request."""
        return self.cost_estimate / self.tokens_used if self.tokens_used else 0
