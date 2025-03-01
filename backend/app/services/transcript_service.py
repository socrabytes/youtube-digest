import yt_dlp
import json
import logging
from typing import Dict, Any, Tuple
import requests

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
                'verbose': True,  # Add verbose output for debugging
            }
            
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                logger.info("Downloading video info")
                info = ydl.extract_info(url, download=False)
                
                # Debug log for subtitles availability
                logger.info(f"Subtitles available: {bool(info.get('subtitles'))}")
                logger.info(f"Auto captions available: {bool(info.get('automatic_captions'))}")
                
                if 'subtitles' in info and info['subtitles']:
                    source = 'manual'
                    subtitles = info['subtitles']
                    logger.info(f"Found manual subtitles: {list(subtitles.keys())}")
                elif 'automatic_captions' in info and info['automatic_captions']:
                    source = 'auto'
                    subtitles = info['automatic_captions']
                    logger.info(f"Found automatic captions: {list(subtitles.keys())}")
                else:
                    # If no subtitles are found, return a placeholder transcript
                    logger.warning("No subtitles found for this video. Using placeholder transcript.")
                    return "[No transcript available for this video]", {"source": "placeholder"}
                
                # Get English subtitles
                if 'en' in subtitles:
                    subs = subtitles['en']
                    logger.info("Found English subtitles")
                else:
                    # Try to find any English variant
                    en_variants = [lang for lang in subtitles.keys() if lang.startswith('en')]
                    if en_variants:
                        logger.info(f"Found English variant subtitles: {en_variants[0]}")
                        subs = subtitles[en_variants[0]]
                    else:
                        # If no English subtitles, try to use any available language
                        if subtitles:
                            first_lang = list(subtitles.keys())[0]
                            logger.warning(f"No English subtitles found. Using {first_lang} instead.")
                            subs = subtitles[first_lang]
                        else:
                            # If no subtitles at all, return a placeholder
                            logger.warning("No usable subtitles found. Using placeholder transcript.")
                            return "[No transcript available for this video]", {"source": "placeholder"}
                
                # Get the json3 format if available
                json3_sub = next((s for s in subs if s['ext'] == 'json3'), None)
                if not json3_sub:
                    # Try other formats if json3 is not available
                    available_formats = [s['ext'] for s in subs]
                    logger.warning(f"No json3 format found. Available formats: {available_formats}")
                    
                    # Try to use any available format
                    if subs:
                        first_format = subs[0]
                        logger.info(f"Using alternative format: {first_format['ext']}")
                        
                        # For non-json3 formats, we'll need to implement specific parsers
                        # For now, return a placeholder
                        return "[Transcript format not supported]", {"source": f"{source}-{first_format['ext']}"}
                    else:
                        return "[No transcript available for this video]", {"source": "placeholder"}
                
                # Download and parse the json3 subtitles
                try:
                    logger.info(f"Downloading subtitles JSON from {json3_sub['url']}")
                    response = requests.get(json3_sub['url'])
                    response.raise_for_status()
                    subtitle_data = response.json()
                    
                    # Extract text from events
                    transcript_str = ""
                    for event in subtitle_data.get('events', []):
                        if 'segs' in event:
                            for seg in event['segs']:
                                if 'utf8' in seg:
                                    transcript_str += seg['utf8'] + " "
                    
                    if not transcript_str.strip():
                        logger.warning("Extracted transcript is empty")
                        return "[Empty transcript]", {"source": source}
                    
                    logger.info(f"Successfully extracted transcript ({len(transcript_str)} chars)")
                    return transcript_str.strip(), {"source": source}
                    
                except requests.RequestException as e:
                    logger.error(f"Failed to download subtitles: {str(e)}", exc_info=True)
                    return f"[Failed to download transcript: {str(e)}]", {"source": "error"}
                except json.JSONDecodeError as e:
                    logger.error(f"Failed to parse subtitles JSON: {str(e)}", exc_info=True)
                    return f"[Failed to parse transcript: {str(e)}]", {"source": "error"}
                
        except Exception as e:
            logger.error(f"Failed to extract transcript: {str(e)}", exc_info=True)
            return f"[Error extracting transcript: {str(e)}]", {"source": "error"}
