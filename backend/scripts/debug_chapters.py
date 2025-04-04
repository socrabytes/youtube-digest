#!/usr/bin/env python
"""
Debug script to diagnose chapter extraction issues
"""
import requests
import json
import time
import os
import logging
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Add the parent directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Import models after adjusting path
from app.models.video import Video
from app.models.channel import Channel
from app.db.database import Base, get_db
from app.core.config import settings
from app.services.video_processor import VideoProcessor
from app.services.exceptions import (
    VideoProcessingError, 
    VideoExtractionError,
    VideoNotFoundError,
    VideoLiveError,
    PrivateVideoError,
    VideoTranscriptError
)

def debug_chapters_extraction():
    """Test direct extraction of chapters and database storage"""
    # Known videos with chapters
    test_urls = [
        "https://www.youtube.com/watch?v=yfoY53QXEnI",  # CSS tutorial
        "https://www.youtube.com/watch?v=tFr0Vg1q9Eg",  # Google I/O
        "https://www.youtube.com/watch?v=PkZNo7MFNFg",  # JavaScript tutorial
    ]
    
    # Initialize VideoProcessor
    processor = VideoProcessor()
    
    # Test each URL
    for url in test_urls:
        logger.info(f"\n\n===== Testing URL: {url} =====")
        
        # Extract info
        try:
            video_info = processor.validate_and_extract_info(url)
            
            # Print general info
            logger.info(f"Video title: {video_info.get('title')}")
            logger.info(f"Video ID: {video_info.get('youtube_id')}")
            
            # Check for chapters
            chapters = video_info.get('chapters')
            if chapters:
                logger.info(f"Found {len(chapters)} processed chapters:")
                for i, chapter in enumerate(chapters):
                    logger.info(f"  Chapter {i+1}: {chapter['timestamp']} - {chapter['title']}")
            else:
                logger.error(f"No chapters found for {url}")
            
            # Connect to database
            db_uri = f"postgresql://{settings.POSTGRES_USER}:{settings.POSTGRES_PASSWORD}@{settings.POSTGRES_SERVER}/{settings.POSTGRES_DB}"
            engine = create_engine(db_uri)
            SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
            
            # Test inserting directly to database
            db = SessionLocal()
            
            # Check if the channel exists, create if not
            channel_id = video_info.get('channel_id')
            channel_title = video_info.get('channel', {}).get('name') if isinstance(video_info.get('channel'), dict) else None
            if not channel_title:
                channel_title = video_info.get('uploader', 'Unknown Channel')
            
            channel_url = video_info.get('channel_url', f"https://www.youtube.com/channel/{channel_id}" if channel_id else "https://youtube.com")
            
            if channel_id:
                channel = db.query(Channel).filter(Channel.youtube_channel_id == channel_id).first()
                
                if not channel:
                    logger.info(f"Creating new channel: {channel_title} with ID {channel_id}")
                    channel = Channel(
                        youtube_channel_id=channel_id,
                        name=channel_title,
                        channel_url=channel_url,
                        uploader=video_info.get('uploader'),
                        uploader_id=video_info.get('uploader_id'),
                        uploader_url=video_info.get('uploader_url')
                    )
                    db.add(channel)
                    db.commit()
                    db.refresh(channel)
                    
                channel_db_id = channel.id
            else:
                # Use a default channel for testing
                logger.warning("No channel ID found, using default testing channel")
                default_channel = db.query(Channel).first()
                if not default_channel:
                    default_channel = Channel(
                        youtube_channel_id="DEFAULT_TEST_CHANNEL",
                        name="Test Channel",
                        channel_url="https://youtube.com/test_channel"
                    )
                    db.add(default_channel)
                    db.commit()
                    db.refresh(default_channel)
                
                channel_db_id = default_channel.id
            
            # Check if video already exists
            existing_video = db.query(Video).filter(Video.youtube_id == video_info['youtube_id']).first()
            
            if existing_video:
                logger.info(f"Video already exists in DB, updating chapters")
                # Log existing chapters
                logger.info(f"Current chapters in DB: {existing_video.chapters}")
                
                # Update chapters directly
                existing_video.chapters = chapters
                db.commit()
                
                # Verify update
                db.refresh(existing_video)
                logger.info(f"Updated chapters in DB: {existing_video.chapters}")
            else:
                logger.info(f"Creating new video with chapters")
                # Create a minimal video entry with chapters
                new_video = Video(
                    youtube_id=video_info['youtube_id'],
                    title=video_info['title'],
                    webpage_url=url,
                    duration=video_info['duration'],
                    chapters=chapters,
                    channel_id=channel_db_id,  # Add channel_id
                    processing_status="COMPLETED"
                )
                db.add(new_video)
                db.commit()
                
                # Verify creation
                db.refresh(new_video)
                logger.info(f"New video created, chapters in DB: {new_video.chapters}")
            
            db.close()
            
        except VideoProcessingError as e:
            logger.error(f"Video processing error: {str(e)}", exc_info=True)
        except VideoExtractionError as e:
            logger.error(f"Video extraction error: {str(e)}", exc_info=True)
        except VideoNotFoundError as e:
            logger.error(f"Video not found error: {str(e)}", exc_info=True)
        except VideoLiveError as e:
            logger.error(f"Video live error: {str(e)}", exc_info=True)
        except PrivateVideoError as e:
            logger.error(f"Private video error: {str(e)}", exc_info=True)
        except VideoTranscriptError as e:
            logger.error(f"Video transcript error: {str(e)}", exc_info=True)
        except Exception as e:
            logger.error(f"Error processing {url}: {str(e)}", exc_info=True)

if __name__ == "__main__":
    debug_chapters_extraction()
