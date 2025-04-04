from typing import Dict, Any, Optional, Tuple
import logging
import json
import yt_dlp
from app.core.config import settings
from app.services.summarizers.openai_summarizer import OpenAISummarizer, SummaryGenerationError
from app.services.transcript_service import TranscriptService, VideoTranscriptError
from app.services.exceptions import (
    VideoProcessingError, 
    VideoExtractionError,
    VideoNotFoundError,
    VideoLiveError,
    PrivateVideoError,
    VideoTranscriptError,
    RateLimitError
)
# Backwards compatibility aliases
VideoNotFoundError = VideoNotFoundError
PrivateVideoError = PrivateVideoError
VideoProcessingError = VideoProcessingError
RateLimitError = RateLimitError

import os

logger = logging.getLogger(__name__)

class VideoProcessor:
    def __init__(self):
        self.summarizer = OpenAISummarizer()
        self.transcript_service = TranscriptService()

    def validate_and_extract_info(self, url: str) -> dict:
        """Extract video information from URL.
        
        Args:
            url: YouTube video URL
            
        Returns:
            Dictionary with video information
            
        Raises:
            VideoProcessingError: If video extraction fails
        """
        try:
            # Configure yt-dlp options
            ydl_opts = {
                'quiet': True,
                'no_warnings': True,
                'extract_flat': False,  # Changed to False to get full info including chapters
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

                # Extract chapters
                chapters = self._process_chapters(info.get('chapters', []))
                logger.info(f"Extracted {len(chapters)} chapters from video")

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
                    'chapters': chapters,
                    'transcript': transcript_text,
                    'transcript_source': transcript_info.get('source'),
                    'webpage_url': info.get('webpage_url', '')
                }

                return video_data

        except (VideoNotFoundError, PrivateVideoError) as e:
            # Re-raise known exceptions
            raise
        except Exception as e:
            logger.error(f"Unexpected error processing video: {str(e)}", exc_info=True)
            raise VideoProcessingError(f"Failed to process video: {str(e)}")

    def _process_chapters(self, raw_chapters: list) -> list:
        """Process raw chapter data from yt-dlp into a standardized format.
        
        Args:
            raw_chapters: List of chapter dictionaries from yt-dlp
            
        Returns:
            List of formatted chapter dictionaries with start_time and title
        """
        logger.info(f"Processing chapters: {raw_chapters}")
        processed_chapters = []
        
        if not raw_chapters:
            logger.warning("No chapters found in the video data")
            return processed_chapters
            
        for chapter in raw_chapters:
            # Extract required fields
            start_time = chapter.get('start_time')
            title = chapter.get('title')
            
            # Log chapter data for debugging
            logger.info(f"Raw chapter: start_time={start_time}, title={title}")
            
            # Skip if missing essential data
            if start_time is None or not title:
                logger.warning(f"Skipping chapter with missing data: {chapter}")
                continue
                
            # Format timestamp for UI display (MM:SS format)
            minutes = int(start_time // 60)
            seconds = int(start_time % 60)
            timestamp = f"{minutes}:{seconds:02d}"
            
            # Add end_time if available
            chapter_data = {
                "start_time": start_time,
                "title": title,
                "timestamp": timestamp
            }
            
            if chapter.get('end_time') is not None:
                chapter_data["end_time"] = chapter.get('end_time')
                
            processed_chapters.append(chapter_data)
        
        logger.info(f"Processed {len(processed_chapters)} chapters: {processed_chapters}")    
        return processed_chapters

    def generate_summary(self, video_data: dict) -> str:
        """Generate a summary of the video using OpenAI.
        
        Creates a structured summary with:
        - Key Takeaways: Bullet points of main concepts
        - Why Watch: Reasons why the video is worth watching
        - Main content summary
        
        Args:
            video_data: Video data dictionary containing transcript and metadata
            
        Returns:
            Structured markdown summary of the video
        """
        logger.info("[VideoProcessor] Starting OpenAI API summary generation")
        
        transcript = video_data.get("transcript", "")
        if not transcript:
            logger.warning("[VideoProcessor] No transcript available for summary generation")
            return ""
            
        title = video_data.get("title", "")
        description = video_data.get("description", "")
        
        # Include chapters in the system prompt if available
        chapters_text = ""
        chapters = video_data.get("chapters", [])
        if chapters:
            chapters_text = "Video Chapters:\n"
            for chapter in chapters:
                chapters_text += f"- {chapter['timestamp']}: {chapter['title']}\n"
        
        # Improved system prompt with explicit structured output instructions
        system_prompt = f"""You are an expert YouTube video summarizer. Create a concise, informative summary of the video based on the transcript.
        
Video Title: {title}
{f'Video Description: {description}' if description else ''}
{chapters_text}

Your summary should include:

1. A structured overview of the video content
2. Key Takeaways: Bullet points with the most important concepts
3. Why Watch: Bullet points explaining why someone should watch this video

Format your response in a structured format with headers and bullet points:

# Summary
[Concise summary of the video content]

## Key Takeaways:
- [Key point 1]
- [Key point 2]
- [Key point 3]

## Why Watch:
- [Reason 1]
- [Reason 2]

Only include the most significant information and make the summary concise and valuable."""

        # User prompt contains the transcript
        user_prompt = f"Here is the transcript: {transcript}"

        try:
            # Call OpenAI API with improved parameters
            from openai import OpenAI
            client = OpenAI(
                api_key=os.environ.get("OPENAI_API_KEY"),
            )
            
            response = client.chat.completions.create(
                model=os.environ.get("OPENAI_MODEL", "gpt-3.5-turbo"),
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                max_tokens=2048,
                temperature=0.3,
                top_p=1.0,
                frequency_penalty=0.0,
                presence_penalty=0.0,
            )
            
            # Extract summary from response
            summary = response.choices[0].message.content.strip()
            
            # Log token usage
            usage = {
                "prompt_tokens": response.usage.prompt_tokens,
                "completion_tokens": response.usage.completion_tokens,
                "total_tokens": response.usage.total_tokens,
            }
            
            logger.info(f"[VideoProcessor] OpenAI API usage: {usage}")
            
            # Store the usage data for later reference
            video_data["openai_usage"] = usage
            
            return summary
            
        except Exception as e:
            logger.error(f"[VideoProcessor] Failed to generate summary: {str(e)}")
            raise VideoProcessingError(f"Failed to generate summary: {str(e)}")
