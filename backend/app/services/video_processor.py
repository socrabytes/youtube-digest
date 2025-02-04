from typing import Dict, Any, Optional, Tuple
import logging
import json
import yt_dlp
from app.core.config import settings
from app.services.summarizers.openai_summarizer import OpenAISummarizer, SummaryGenerationError
from app.services.transcript_service import TranscriptService, VideoTranscriptError

logger = logging.getLogger(__name__)

class VideoNotFoundError(Exception):
    """Video not found or no longer available."""
    pass

class PrivateVideoError(Exception):
    """Video is private and cannot be accessed."""
    pass

class VideoProcessingError(Exception):
    """General error during video processing."""
    pass

class RateLimitError(Exception):
    """Rate limit exceeded."""
    pass

class VideoProcessor:
    def __init__(self):
        self.summarizer = OpenAISummarizer()
        self.transcript_service = TranscriptService()

    def validate_and_extract_info(self, url: str) -> Dict[str, Any]:
        """Extract video information with validation."""
        try:
            # Configure yt-dlp options
            ydl_opts = {
                'quiet': True,
                'no_warnings': True,
                'extract_flat': True,
            }
            
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                # Extract video information
                try:
                    info = ydl.extract_info(url, download=False)
                except Exception as e:
                    logger.error(f"Error extracting video info: {str(e)}", exc_info=True)
                    if "Private video" in str(e):
                        raise PrivateVideoError("This video is private")
                    elif "Video unavailable" in str(e):
                        raise VideoNotFoundError("Video not found or no longer available")
                    else:
                        raise VideoProcessingError(f"Failed to extract video info: {str(e)}")

                # Validate required fields
                if not info:
                    raise VideoProcessingError("No video information found")
                
                if info.get('_type') == 'playlist':
                    raise VideoProcessingError("Playlists are not supported")

                if info.get('is_live'):
                    raise VideoProcessingError("Live streams are not supported")

                # Check for private videos
                if info.get('private'):
                    raise PrivateVideoError("This video is private")

                # Extract and validate required fields
                video_id = info.get('id')
                if not video_id:
                    raise VideoProcessingError("Could not extract video ID")

                title = info.get('title', '').strip()
                if not title:
                    raise VideoProcessingError("Could not extract video title")

                duration = info.get('duration')
                if not duration:
                    raise VideoProcessingError("Could not extract video duration")

                # Extract transcript
                try:
                    transcript_text, transcript_info = self.transcript_service.extract_transcript(url)
                    logger.info(f"Successfully extracted transcript ({len(transcript_text)} chars)")
                except VideoTranscriptError as e:
                    logger.warning(f"Could not extract transcript: {str(e)}")
                    transcript_text = None
                    transcript_info = {"source": None}

                # Build video data dictionary with validated fields
                video_data = {
                    'youtube_id': video_id,
                    'title': title,
                    'duration': duration,
                    'thumbnail_url': info.get('thumbnail'),
                    'view_count': info.get('view_count'),
                    'like_count': info.get('like_count'),
                    'channel_id': info.get('channel_id'),
                    'channel_title': info.get('channel', '').strip(),
                    'upload_date': info.get('upload_date'),
                    'description': info.get('description', '').strip(),
                    'tags': info.get('tags', []),
                    'categories': info.get('categories', []),
                    'transcript': transcript_text,
                    'transcript_source': transcript_info.get('source')
                }

                return video_data

        except (VideoNotFoundError, PrivateVideoError) as e:
            # Re-raise known exceptions
            raise
        except Exception as e:
            # Log unexpected errors
            logger.error(f"Unexpected error processing video: {str(e)}", exc_info=True)
            raise VideoProcessingError(f"Failed to process video: {str(e)}")

    def generate_summary(self, video_data: dict) -> str:
        """Generate a summary of the video using OpenAI."""
        logger.info("[VideoProcessor] Starting OpenAI API summary generation")
        
        if not video_data.get('transcript'):
            logger.error("[VideoProcessor] No transcript available for summary generation")
            raise SummaryGenerationError("No transcript available for summary generation")

        try:
            logger.info("[VideoProcessor] Sending request to OpenAI API")
            result = self.summarizer.generate(video_data['transcript'])
            logger.info("[VideoProcessor] Successfully generated summary")
            return result['summary']
        except Exception as e:
            logger.error(f"[VideoProcessor] Summary generation failed: {str(e)}", exc_info=True)
            raise SummaryGenerationError(f"Failed to generate summary: {str(e)}")
