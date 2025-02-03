"""URL validation utilities."""
import re
from typing import Tuple

def validate_youtube_url(url: str) -> Tuple[bool, str]:
    """
    Validate a YouTube URL.
    
    Args:
        url: The URL to validate
        
    Returns:
        Tuple[bool, str]: (is_valid, error_message)
    """
    if not url:
        return False, "URL cannot be empty"
        
    # Common YouTube URL patterns
    patterns = [
        r'^https?://(?:www\.)?youtube\.com/watch\?v=[\w-]+',  # Standard watch URLs
        r'^https?://(?:www\.)?youtube\.com/v/[\w-]+',         # Legacy embed URLs
        r'^https?://youtu\.be/[\w-]+',                        # Short URLs
        r'^https?://(?:www\.)?youtube\.com/embed/[\w-]+'      # Embed URLs
    ]
    
    # Check if URL matches any valid pattern
    for pattern in patterns:
        if re.match(pattern, url):
            return True, ""
            
    return False, "Invalid YouTube URL format. Please provide a valid YouTube video URL"
