import yt_dlp
from openai import OpenAI
from app.core.config import settings
from typing import Optional, Dict, Any, Tuple
import json
import logging
from app.utils.validators import validate_youtube_url

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class VideoProcessingError(Exception):
    """Base exception for video processing errors."""
    pass

class VideoNotFoundError(VideoProcessingError):
    """Video not found or no longer available."""
    pass

class PrivateVideoError(VideoProcessingError):
    """Video is private or requires authentication."""
    pass

class RateLimitError(VideoProcessingError):
    """Rate limit exceeded."""
    pass

class VideoProcessor:
    def __init__(self):
        self.client: Optional[OpenAI] = None
        if settings.OPENAI_API_KEY:
            self.client = OpenAI(api_key=settings.OPENAI_API_KEY)

    def validate_and_extract_info(self, url: str) -> Dict[str, Any]:
        """
        Validate URL and extract video information with comprehensive error handling.
        
        Args:
            url: YouTube video URL
            
        Returns:
            Dict containing video metadata
            
        Raises:
            VideoProcessingError: Base class for all video processing errors
            VideoNotFoundError: Video not found or no longer available
            PrivateVideoError: Video is private
            RateLimitError: Rate limit exceeded
        """
        # Validate URL format
        is_valid, error_message = validate_youtube_url(url)
        if not is_valid:
            raise VideoProcessingError(error_message)
            
        return self.extract_video_info(url)

    def extract_video_info(self, url: str) -> Dict[str, Any]:
        logger.info(f"Extracting info for URL: {url}")
        ydl_opts = {
            'format': 'best',
            'extract_flat': False,
            'writesubtitles': True,
            'writeautomaticsub': True,
            'subtitlesformat': 'vtt',
            'verbose': True
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            try:
                info = ydl.extract_info(url, download=False)
                logger.info("Successfully extracted basic video info")
                
                # Check for private videos
                if info.get('private'):
                    raise PrivateVideoError("This video is private")
                
                # Check video availability
                if info.get('unavailable'):
                    raise VideoNotFoundError("This video is no longer available")
                
                # Safely get values with type checking
                tags = []
                if isinstance(info.get('tags'), list):
                    tags = [str(tag) for tag in info['tags'] if tag is not None]
                
                categories = []
                if isinstance(info.get('categories'), list):
                    categories = [str(cat) for cat in info['categories'] if cat is not None]
                
                # Ensure all values are of the correct type
                try:
                    view_count = int(info.get('view_count')) if info.get('view_count') is not None else None
                    duration = int(info.get('duration')) if info.get('duration') is not None else None
                    subscriber_count = int(info.get('channel_subscriber_count')) if info.get('channel_subscriber_count') is not None else None
                    like_count = int(info.get('like_count')) if info.get('like_count') is not None else None
                except (ValueError, TypeError) as e:
                    logger.warning(f"Error converting numeric fields: {str(e)}")
                    view_count = duration = subscriber_count = like_count = None
                
                # Build the video data dictionary
                video_data = {
                    'youtube_id': str(info.get('id', '')).strip(),
                    'title': str(info.get('title', '')).strip(),
                    'thumbnail_url': str(info.get('thumbnail', '')).strip(),
                    'url': str(url).strip(),
                    'duration': duration,
                    'view_count': view_count,
                    'subscriber_count': subscriber_count,
                    'channel_id': str(info.get('channel_id', '')).strip(),
                    'channel_title': str(info.get('uploader', '')).strip(),
                    'upload_date': info.get('upload_date'),  # YYYYMMDD format
                    'like_count': like_count,
                    'description': info.get('description', '').strip(),
                    'tags': tags,
                    'categories': categories,
                    'transcript': None,
                    'error': None
                }
                
                # Try to get transcript URL
                transcript_url = self._extract_transcript(info)
                if transcript_url:
                    video_data['transcript'] = str(transcript_url).strip()
                
                # Validate required fields
                required_fields = ['youtube_id', 'title', 'duration']
                missing_fields = [field for field in required_fields if not video_data.get(field)]
                if missing_fields:
                    raise VideoProcessingError(f"Missing required fields: {', '.join(missing_fields)}")
                
                # Log the final data for debugging
                logger.info("Successfully processed video info")
                logger.debug(f"Final video data: {video_data}")
                
                return video_data
                
            except yt_dlp.utils.DownloadError as e:
                error_msg = str(e).lower()
                if "private video" in error_msg:
                    raise PrivateVideoError("This video is private")
                elif "not available" in error_msg:
                    raise VideoNotFoundError("This video is no longer available")
                elif "rate limit" in error_msg:
                    raise RateLimitError("YouTube API rate limit exceeded")
                else:
                    logger.error(f"Error extracting video info: {str(e)}", exc_info=True)
                    raise VideoProcessingError(f"Failed to extract video info: {str(e)}")
            except Exception as e:
                logger.error(f"Unexpected error extracting video info: {str(e)}", exc_info=True)
                raise VideoProcessingError(f"An unexpected error occurred: {str(e)}")

    def _extract_transcript(self, info: Dict[str, Any]) -> Optional[str]:
        """Extract transcript from video subtitles if available."""
        try:
            logger.info("Attempting to extract transcript")
            if info.get('subtitles'):
                logger.info(f"Available subtitles: {info['subtitles'].keys()}")
                en_subs = info['subtitles'].get('en')
                if en_subs and len(en_subs) > 0:
                    logger.info("Found English subtitles")
                    return en_subs[0].get('url', '')
            
            if info.get('automatic_captions'):
                logger.info(f"Available auto-captions: {info['automatic_captions'].keys()}")
                auto_subs = info['automatic_captions'].get('en')
                if auto_subs and len(auto_subs) > 0:
                    logger.info("Found English auto-captions")
                    return auto_subs[0].get('url', '')
            
            logger.info("No subtitles or auto-captions found")
            return None
            
        except Exception as e:
            logger.error(f"Error extracting transcript: {str(e)}", exc_info=True)
            return None

    def generate_summary(self, video_data: Dict[str, Any]) -> Optional[str]:
        """Generate a summary of the video using OpenAI."""
        if not self.client:
            logger.warning("OpenAI client not initialized - skipping summary generation")
            return None

        try:
            # Prepare the prompt with video information
            prompt = f"""Summarize this YouTube video based on the following information:
Title: {video_data['title']}
Duration: {video_data.get('duration', 'Unknown')} seconds
Categories: {', '.join(video_data.get('categories', []))}
Tags: {', '.join(video_data.get('tags', []))}

Please provide a concise 2-3 sentence summary that captures the main topic and value proposition of this video.
Focus on what viewers will learn or experience."""

            # Call OpenAI API (synchronously)
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a helpful assistant that creates concise video summaries."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=150,
                temperature=0.7
            )
            
            summary = response.choices[0].message.content.strip()
            logger.info(f"Generated summary for video {video_data['youtube_id']}")
            return summary

        except Exception as e:
            logger.error(f"Error generating summary: {str(e)}", exc_info=True)
            return None
