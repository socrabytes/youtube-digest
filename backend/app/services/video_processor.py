import yt_dlp
from openai import OpenAI
from app.core.config import settings
from typing import Optional, Dict, Any
import json
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class VideoProcessor:
    def __init__(self):
        self.client: Optional[OpenAI] = None
        if settings.OPENAI_API_KEY:
            self.client = OpenAI(api_key=settings.OPENAI_API_KEY)

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
                
                # Safely get values with type checking
                tags = []
                if isinstance(info.get('tags'), list):
                    tags = [str(tag) for tag in info['tags'] if tag is not None]
                
                categories = []
                if isinstance(info.get('categories'), list):
                    categories = [str(cat) for cat in info['categories'] if cat is not None]
                
                # Ensure all values are of the correct type
                view_count = info.get('view_count')
                if view_count is not None:
                    try:
                        view_count = int(view_count)
                    except (ValueError, TypeError):
                        view_count = None
                
                duration = info.get('duration')
                if duration is not None:
                    try:
                        duration = int(duration)
                    except (ValueError, TypeError):
                        duration = None
                
                # Build the video data dictionary
                video_data = {
                    'youtube_id': str(info.get('id', '')).strip(),
                    'title': str(info.get('title', '')).strip(),
                    'thumbnail_url': str(info.get('thumbnail', '')).strip(),
                    'url': str(url).strip(),
                    'duration': duration,
                    'view_count': view_count,
                    'channel_id': str(info.get('channel_id', '')).strip(),
                    'channel_title': str(info.get('uploader', '')).strip(),
                    'tags': tags,
                    'categories': categories,
                    'transcript': None
                }
                
                # Try to get transcript URL
                transcript_url = self._extract_transcript(info)
                if transcript_url:
                    video_data['transcript'] = str(transcript_url).strip()
                
                # Log the final data for debugging
                logger.info("Successfully processed video info")
                logger.info(f"Final video data: {video_data}")
                
                return video_data
                
            except Exception as e:
                logger.error(f"Error extracting video info: {str(e)}", exc_info=True)
                raise Exception(f"Failed to extract video info: {str(e)}")

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
