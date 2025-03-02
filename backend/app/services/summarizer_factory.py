from typing import Optional, Dict, Any
import logging
from app.core.config import settings
from app.services.summarizers import (
    SummarizerInterface,
    OpenAISummarizer,
    GoogleAISummarizer,
    SummaryFormat
)

logger = logging.getLogger(__name__)

# Check if Google AI is available
try:
    # Import just to check
    from google.generativeai import GenerativeModel
    GOOGLE_AI_AVAILABLE = True
except ImportError:
    logger.warning("Google GenerativeAI library not installed. Will default to OpenAI.")
    GOOGLE_AI_AVAILABLE = False

def get_summarizer(provider: str = "openai") -> SummarizerInterface:
    """
    Factory function to get the appropriate summarizer based on the provider.
    
    Args:
        provider: The LLM provider to use (openai, google)
        
    Returns:
        An instance of a SummarizerInterface implementation
    """
    provider = provider.lower()
    
    if provider == "google" and GOOGLE_AI_AVAILABLE and settings.has_google_key:
        logger.info("Using Google AI summarizer")
        return GoogleAISummarizer()
    else:
        if provider == "google":
            reason = "API key not configured" if not settings.has_google_key else "library not installed"
            logger.warning(f"Cannot use Google AI provider: {reason}. Falling back to OpenAI")
        elif provider != "openai":
            logger.warning(f"Provider '{provider}' not supported, falling back to OpenAI")
        
        logger.info("Using OpenAI summarizer")
        return OpenAISummarizer()

def map_digest_type_to_summary_format(digest_type: str) -> SummaryFormat:
    """
    Maps digest types to appropriate summary formats.
    
    Args:
        digest_type: The digest type string
        
    Returns:
        The corresponding SummaryFormat
    """
    mapping = {
        "summary": SummaryFormat.STANDARD,
        "detailed": SummaryFormat.DETAILED,
        "highlights": SummaryFormat.ENHANCED,
        "chapters": SummaryFormat.ENHANCED,
        "concise": SummaryFormat.CONCISE,
    }
    
    return mapping.get(digest_type, SummaryFormat.ENHANCED)
