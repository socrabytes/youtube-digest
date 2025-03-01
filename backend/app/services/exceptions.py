"""
Exceptions for video processing services
"""

class VideoNotFoundError(Exception):
    """Video not found or no longer available."""
    pass

class PrivateVideoError(Exception):
    """Video is private and cannot be accessed."""
    pass

class VideoProcessingError(Exception):
    """General error during video processing."""
    pass

class VideoExtractionError(Exception):
    """Error during video metadata extraction."""
    pass

class VideoLiveError(Exception):
    """Video is a live stream and cannot be processed."""
    pass

class VideoTranscriptError(Exception):
    """Error during transcript extraction."""
    pass

class RateLimitError(Exception):
    """Rate limit exceeded."""
    pass

class SummaryGenerationError(Exception):
    """Base exception for summary generation errors."""
    pass
