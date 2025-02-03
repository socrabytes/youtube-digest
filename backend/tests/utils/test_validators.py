"""Test URL validation utilities."""
import pytest
from app.utils.validators import validate_youtube_url

def test_validate_youtube_url():
    """Test YouTube URL validation."""
    # Valid URLs
    valid_urls = [
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'http://youtube.com/watch?v=dQw4w9WgXcQ',
        'https://youtu.be/dQw4w9WgXcQ',
        'https://www.youtube.com/embed/dQw4w9WgXcQ',
        'https://youtube.com/v/dQw4w9WgXcQ'
    ]
    
    for url in valid_urls:
        is_valid, error = validate_youtube_url(url)
        assert is_valid, f"URL should be valid: {url}"
        assert error == "", f"Error should be empty for valid URL: {url}"
    
    # Invalid URLs
    invalid_urls = [
        '',  # Empty URL
        'not a url',  # Plain text
        'https://youtube.com',  # Missing video ID
        'https://youtu.be/',  # Missing video ID
        'https://vimeo.com/123456',  # Wrong platform
        'https://www.youtube.com/channel/123456',  # Channel URL
        'https://www.youtube.com/playlist?list=123456'  # Playlist URL
    ]
    
    for url in invalid_urls:
        is_valid, error = validate_youtube_url(url)
        assert not is_valid, f"URL should be invalid: {url}"
        assert error != "", f"Error should not be empty for invalid URL: {url}"
