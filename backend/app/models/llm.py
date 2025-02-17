from sqlalchemy import Column, Integer, String, Numeric, UniqueConstraint
from sqlalchemy.orm import relationship

from .base import Base, TimestampMixin

class LLM(Base, TimestampMixin):
    """
    Stores information about Language Learning Models used for digest generation.
    Tracks costs and maintains a history of model versions and their characteristics.
    """
    __tablename__ = "llms"
    __table_args__ = (
        UniqueConstraint('name', 'base_cost_per_token', name='uq_llm_name_cost'),
    )

    # Primary key
    id = Column(Integer, primary_key=True, index=True)
    
    # LLM information
    name = Column(String(100), nullable=False, index=True,
                 comment="Model name (e.g., 'gpt-4', 'claude-2')")
    description = Column(String(500), nullable=True,
                        comment="Model capabilities and characteristics")
    base_cost_per_token = Column(Numeric(10, 8), nullable=False,
                                comment="Base cost per token in USD")
    
    # Relationships
    digests = relationship("Digest", back_populates="llm",
                          cascade="all, delete-orphan")
    processing_logs = relationship("ProcessingLog", back_populates="llm",
                                 cascade="all, delete-orphan")
    
    def __repr__(self):
        """String representation of the LLM."""
        return f"<LLM(id={self.id}, name='{self.name}', cost={self.base_cost_per_token})>"
    
    def calculate_cost(self, token_count: int) -> float:
        """Calculate cost for a given number of tokens."""
        return float(self.base_cost_per_token * token_count)
    
    @property
    def cost_per_1k_tokens(self) -> float:
        """Get the cost per 1000 tokens for easy comparison."""
        return float(self.base_cost_per_token * 1000)
