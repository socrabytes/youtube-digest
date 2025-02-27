#!/usr/bin/env python
"""
Script to reprocess videos that are stuck in the "PROCESSING" state.
"""
import sys
import os
import logging
import requests
import time
from typing import List, Dict, Any

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# API configuration
API_BASE_URL = "http://localhost:8000/api/v1"

def get_videos() -> List[Dict[str, Any]]:
    """Get all videos from the API."""
    try:
        response = requests.get(f"{API_BASE_URL}/videos/")
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        logger.error(f"Failed to get videos: {e}")
        return []

def process_video(video_id: int) -> bool:
    """Trigger processing for a specific video."""
    try:
        response = requests.post(f"{API_BASE_URL}/videos/{video_id}/process")
        response.raise_for_status()
        logger.info(f"Successfully triggered processing for video ID {video_id}")
        return True
    except requests.RequestException as e:
        logger.error(f"Failed to process video {video_id}: {e}")
        return False

def main():
    """Main function to reprocess videos."""
    logger.info("Starting video reprocessing script")
    
    # Get all videos
    videos = get_videos()
    logger.info(f"Found {len(videos)} videos")
    
    # Filter videos by processing status
    pending_videos = [v for v in videos if v.get("processing_status") == "PENDING"]
    processing_videos = [v for v in videos if v.get("processing_status") == "PROCESSING"]
    failed_videos = [v for v in videos if v.get("processing_status") == "FAILED"]
    
    logger.info(f"Status breakdown: PENDING={len(pending_videos)}, PROCESSING={len(processing_videos)}, FAILED={len(failed_videos)}")
    
    # Process videos that need reprocessing
    videos_to_process = pending_videos + processing_videos + failed_videos
    
    if not videos_to_process:
        logger.info("No videos need reprocessing")
        return
    
    logger.info(f"Will attempt to reprocess {len(videos_to_process)} videos")
    
    # Process each video with a delay to avoid overwhelming the system
    for i, video in enumerate(videos_to_process):
        video_id = video.get("id")
        logger.info(f"Processing video {i+1}/{len(videos_to_process)}: ID={video_id}, Title={video.get('title')}")
        
        success = process_video(video_id)
        
        # Add a delay between requests
        if i < len(videos_to_process) - 1:  # Don't sleep after the last video
            time.sleep(2)  # 2 second delay
    
    logger.info("Video reprocessing completed")

if __name__ == "__main__":
    main()
