import yt_dlp
import json
import logging
from typing import Dict, Any, Tuple

logger = logging.getLogger(__name__)

class VideoTranscriptError(Exception):
    """Base exception for transcript extraction errors."""
    pass

class TranscriptService:
    @staticmethod
    def extract_transcript(url: str) -> Tuple[str, Dict[str, Any]]:
        """Extract transcript from a YouTube video."""
        try:
            logger.info(f"Extracting transcript from {url}")
            ydl_opts = {
                'writesubtitles': True,
                'writeautomaticsub': True,
                'subtitlesformat': 'json3',
                'skip_download': True,
            }
            
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                logger.info("Downloading video info")
                info = ydl.extract_info(url, download=False)
                
                if 'subtitles' in info and info['subtitles']:
                    source = 'manual'
                    subtitles = info['subtitles']
                elif 'automatic_captions' in info and info['automatic_captions']:
                    source = 'auto'
                    subtitles = info['automatic_captions']
                else:
                    raise VideoTranscriptError("No subtitles found for this video")
                
                # Get English subtitles
                if 'en' in subtitles:
                    subs = subtitles['en']
                else:
                    # Try to find any English variant
                    en_variants = [lang for lang in subtitles.keys() if lang.startswith('en')]
                    if not en_variants:
                        raise VideoTranscriptError("No English subtitles found")
                    subs = subtitles[en_variants[0]]
                
                # Get the json3 format if available
                json3_sub = next((s for s in subs if s['ext'] == 'json3'), None)
                if not json3_sub:
                    raise VideoTranscriptError("No json3 format subtitles found")
                
                logger.info("Downloading subtitles")
                transcript_str = ""
                for entry in json3_sub['subtitles']:
                    if 'text' in entry:
                        transcript_str += entry['text'] + " "
                
                logger.info(f"Successfully extracted transcript ({len(transcript_str)} chars)")
                return transcript_str.strip(), {"source": source}
                
        except VideoTranscriptError:
            raise
        except Exception as e:
            logger.error(f"Failed to extract transcript: {str(e)}", exc_info=True)
            raise VideoTranscriptError(f"Failed to extract transcript: {str(e)}")
