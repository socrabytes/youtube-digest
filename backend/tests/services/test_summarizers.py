import pytest
from app.services.summarizers import (
    SummarizerInterface, 
    OpenAISummarizer, 
    SummaryFormat,
    SummaryGenerationError
)
from app.services.summarizer_factory import get_summarizer, map_digest_type_to_summary_format

def test_summarizer_interface():
    """Test that our summarizer implementations follow the interface."""
    summarizer = OpenAISummarizer()
    
    # Test that the summarizer implements all required methods
    assert hasattr(summarizer, 'generate')
    assert hasattr(summarizer, 'calculate_cost')
    assert hasattr(summarizer, 'get_prompt_for_format')
    
    # Test format mapping
    assert map_digest_type_to_summary_format("summary") == SummaryFormat.STANDARD
    assert map_digest_type_to_summary_format("detailed") == SummaryFormat.DETAILED
    assert map_digest_type_to_summary_format("highlights") == SummaryFormat.ENHANCED
    assert map_digest_type_to_summary_format("unknown") == SummaryFormat.ENHANCED
    
    # Test summarizer factory
    assert isinstance(get_summarizer("openai"), OpenAISummarizer)
    assert isinstance(get_summarizer("invalid"), OpenAISummarizer)  # Should default to OpenAI

def test_prompt_generation():
    """Test that the prompts are properly generated."""
    summarizer = OpenAISummarizer()
    
    # Test the prompts for different formats
    standard_prompt = summarizer.get_prompt_for_format(SummaryFormat.STANDARD)
    enhanced_prompt = summarizer.get_prompt_for_format(SummaryFormat.ENHANCED)
    concise_prompt = summarizer.get_prompt_for_format(SummaryFormat.CONCISE)
    detailed_prompt = summarizer.get_prompt_for_format(SummaryFormat.DETAILED)
    
    # Check that each prompt is different
    assert standard_prompt != enhanced_prompt
    assert standard_prompt != concise_prompt
    assert standard_prompt != detailed_prompt
    assert enhanced_prompt != concise_prompt
    assert enhanced_prompt != detailed_prompt
    assert concise_prompt != detailed_prompt
    
    # Check content of the prompts
    assert "Ultra-concise summary" in enhanced_prompt
    assert "Key Takeaways" in enhanced_prompt
    assert "Why Watch" in enhanced_prompt
    assert "Section Breakdown" in enhanced_prompt
    assert "Full Narrative Summary" in enhanced_prompt
    
    assert "very concise summary" in concise_prompt.lower()
    assert "comprehensive" in detailed_prompt.lower()
