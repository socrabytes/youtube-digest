import yt_dlp
import logging
from typing import Optional, Tuple, Dict, Any

logger = logging.getLogger(__name__)

class VideoTranscriptError(Exception):
    """Base exception for transcript processing errors."""
    pass

class TranscriptNotFoundError(VideoTranscriptError):
    """No transcript available for the video."""
    pass

class TranscriptService:
    @staticmethod
    def extract_transcript(url: str) -> Tuple[Optional[str], Dict[str, Any]]:
        """Extract and parse YouTube transcript."""
        ydl_opts = {
            'writesubtitles': True,
            'writeautomaticsub': True,
            'subtitleslangs': ['en'],
            'skip_download': True,
            'subtitlesformat': 'json3',
            'quiet': True,
            'no_warnings': True,
        }

        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)
                transcript = TranscriptParser.parse(info)
                if not transcript:
                    raise TranscriptNotFoundError("No transcript available for this video")
                    
                metadata = {
                    'source': 'manual' if info.get('subtitles') else 'auto',
                    'language': 'en',
                    'duration': info.get('duration')
                }
                return transcript, metadata
                
        except Exception as e:
            logger.error(f"Transcript extraction failed: {str(e)}")
            raise VideoTranscriptError(f"Failed to extract transcript: {str(e)}")

class TranscriptParser:
    @staticmethod
    def parse(info: Dict[str, Any]) -> Optional[str]:
        """Parse JSON3 transcript data into clean text."""
        try:
            # Try manual subtitles first, then fall back to auto-captions
            subs = info.get('subtitles') or info.get('automatic_captions') or {}
            en_subs = subs.get('en', [])
            
            if not en_subs:
                return None
                
            # Get first available subtitle data
            sub_data = en_subs[0].get('data', {})
            if not sub_data:
                return None
                
            # Extract and clean text from segments
            text_segments = []
            for event in sub_data.get('events', []):
                for seg in event.get('segs', []):
                    if seg.get('utf8'):
                        text_segments.append(seg['utf8'].strip())
            
            return ' '.join(text_segments) if text_segments else None
            
        except Exception as e:
            logger.error(f"Failed to parse transcript: {str(e)}")
            return None
