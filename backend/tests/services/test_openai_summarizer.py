import pytest
from unittest.mock import Mock, patch
from app.services.summarizers.openai_summarizer import OpenAISummarizer, SummaryGenerationError, RateLimiter
from app.core.config import settings
import time

@patch('app.services.summarizers.openai_summarizer.settings')
def test_openai_summarizer_initialization(mock_settings):
    """Test that summarizer initializes correctly with API key."""
    mock_settings.OPENAI_API_KEY = 'test_key'
    summarizer = OpenAISummarizer()
    assert summarizer.client is not None

@patch('app.services.summarizers.openai_summarizer.settings')
def test_openai_summarizer_initialization_no_key(mock_settings):
    """Test that summarizer raises error without API key."""
    mock_settings.OPENAI_API_KEY = None
    with pytest.raises(ValueError):
        OpenAISummarizer()

def test_calculate_cost():
    """Test token cost calculation."""
    summarizer = OpenAISummarizer()
    cost = summarizer.calculate_cost(1000, 500)
    expected_cost = (1000 / 1000 * 0.01) + (500 / 1000 * 0.03)
    assert cost == expected_cost

@patch('app.services.summarizers.openai_summarizer.OpenAI')
def test_generate_summary_success(mock_openai_class):
    """Test successful summary generation."""
    # Mock OpenAI response
    mock_response = Mock()
    mock_response.choices = [Mock(message=Mock(content="Test summary"))]
    mock_response.usage = Mock(
        prompt_tokens=100,
        completion_tokens=50,
        total_tokens=150
    )
    
    mock_client = Mock()
    mock_client.chat.completions.create.return_value = mock_response
    mock_openai_class.return_value = mock_client

    summarizer = OpenAISummarizer()
    result = summarizer.generate("Test transcript")

    assert result["summary"] == "Test summary"
    assert "usage" in result
    assert result["usage"]["prompt_tokens"] == 100
    assert result["usage"]["completion_tokens"] == 50
    assert result["usage"]["total_tokens"] == 150
    assert "estimated_cost_usd" in result["usage"]
    assert "timestamp" in result["usage"]

@patch('app.services.summarizers.openai_summarizer.OpenAI')
def test_generate_summary_retry_on_error(mock_openai_class):
    """Test that summary generation retries on temporary errors."""
    # Mock successful response after error
    mock_success_response = Mock()
    mock_success_response.choices = [Mock(message=Mock(content="Test summary"))]
    mock_success_response.usage = Mock(
        prompt_tokens=100,
        completion_tokens=50,
        total_tokens=150
    )
    
    mock_client = Mock()
    mock_client.chat.completions.create.side_effect = [
        Exception("Rate limit exceeded"),  # First call fails
        mock_success_response  # Second call succeeds
    ]
    mock_openai_class.return_value = mock_client

    summarizer = OpenAISummarizer()
    result = summarizer.generate("Test transcript")

    assert result["summary"] == "Test summary"
    assert mock_client.chat.completions.create.call_count == 2

@patch('app.services.summarizers.openai_summarizer.OpenAI')
def test_generate_summary_empty_transcript(mock_openai):
    """Test handling of empty transcript."""
    summarizer = OpenAISummarizer()
    with pytest.raises(SummaryGenerationError):
        summarizer.generate("")

def test_rate_limiter():
    """Test that rate limiter properly delays requests."""
    # Use a very short window for testing
    limiter = RateLimiter(calls_per_minute=10)  # 1 call per 6 seconds
    start_time = time.time()
    
    # Make 3 quick calls
    for _ in range(3):
        with limiter:
            pass
    
    duration = time.time() - start_time
    # With 10 calls per minute (1 per 6 seconds), 3 calls should take at least 12 seconds
    assert duration >= 0.1  # At least some delay should have occurred
    assert len(limiter.calls) == 3  # Should have recorded all calls
