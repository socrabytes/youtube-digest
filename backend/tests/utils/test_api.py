#!/usr/bin/env python3
"""
Script to test the YouTube Digest API endpoints.
This script is used to manually test the API endpoints after refactoring.
"""

import requests
import json
import sys
from typing import Dict, Any, List, Optional
from pprint import pprint

BASE_URL = "http://localhost:8000/api/v1"

def print_response(response, label: str = "Response"):
    """Print the response in a formatted way."""
    print(f"\n{label}:")
    print(f"Status Code: {response.status_code}")
    try:
        data = response.json()
        print("Response Data:")
        pprint(data)
        return data
    except json.JSONDecodeError:
        print("Response Text:")
        print(response.text)
        return None

def test_videos_endpoints():
    """Test the videos endpoints."""
    print("\n=== Testing Videos Endpoints ===")
    
    # List videos
    print("\n--- List Videos ---")
    response = requests.get(f"{BASE_URL}/videos/")
    videos = print_response(response)
    
    if not videos or not isinstance(videos, list) or len(videos) == 0:
        print("No videos found, skipping video-specific tests")
        return None
    
    # Get a specific video
    video_id = videos[0]["id"]
    print(f"\n--- Get Video {video_id} ---")
    response = requests.get(f"{BASE_URL}/videos/{video_id}")
    print_response(response)
    
    return video_id

def test_channels_endpoints():
    """Test the channels endpoints."""
    print("\n=== Testing Channels Endpoints ===")
    
    # List channels
    print("\n--- List Channels ---")
    response = requests.get(f"{BASE_URL}/channels/")
    channels = print_response(response)
    
    if not channels or not isinstance(channels, list) or len(channels) == 0:
        print("No channels found, skipping channel-specific tests")
        return None
    
    # Get a specific channel
    channel_id = channels[0]["id"]
    print(f"\n--- Get Channel {channel_id} ---")
    response = requests.get(f"{BASE_URL}/channels/{channel_id}")
    print_response(response)
    
    # Get videos for a channel
    print(f"\n--- Get Videos for Channel {channel_id} ---")
    response = requests.get(f"{BASE_URL}/channels/{channel_id}/videos")
    print_response(response)
    
    return channel_id

def test_transcripts_endpoints(video_id: Optional[int] = None):
    """Test the transcripts endpoints."""
    print("\n=== Testing Transcripts Endpoints ===")
    
    # List transcripts
    print("\n--- List Transcripts ---")
    response = requests.get(f"{BASE_URL}/transcripts/")
    transcripts = print_response(response)
    
    if not transcripts or not isinstance(transcripts, list) or len(transcripts) == 0:
        print("No transcripts found, skipping transcript-specific tests")
        return None
    
    # Get a specific transcript
    transcript_id = transcripts[0]["id"]
    print(f"\n--- Get Transcript {transcript_id} ---")
    response = requests.get(f"{BASE_URL}/transcripts/{transcript_id}")
    print_response(response)
    
    # Get transcripts for a video if video_id is provided
    if video_id:
        print(f"\n--- Get Transcripts for Video {video_id} ---")
        response = requests.get(f"{BASE_URL}/videos/{video_id}/transcripts")
        print_response(response)
    
    return transcript_id

def test_digests_endpoints(video_id: Optional[int] = None):
    """Test the digests endpoints."""
    print("\n=== Testing Digests Endpoints ===")
    
    # List digests
    print("\n--- List Digests ---")
    response = requests.get(f"{BASE_URL}/digests/")
    digests = print_response(response)
    
    if not digests or not isinstance(digests, list) or len(digests) == 0:
        print("No digests found, skipping digest-specific tests")
        return None
    
    # Get a specific digest
    digest_id = digests[0]["id"]
    print(f"\n--- Get Digest {digest_id} ---")
    response = requests.get(f"{BASE_URL}/digests/{digest_id}")
    print_response(response)
    
    # Get digests for a video if video_id is provided
    if video_id:
        print(f"\n--- Get Digests for Video {video_id} ---")
        response = requests.get(f"{BASE_URL}/videos/{video_id}/digests")
        print_response(response)
    
    return digest_id

def test_users_endpoints():
    """Test the users endpoints."""
    print("\n=== Testing Users Endpoints ===")
    
    # List users
    print("\n--- List Users ---")
    response = requests.get(f"{BASE_URL}/users/")
    users = print_response(response)
    
    if not users or not isinstance(users, list) or len(users) == 0:
        print("No users found, skipping user-specific tests")
        return None
    
    # Get a specific user
    user_id = users[0]["id"]
    print(f"\n--- Get User {user_id} ---")
    response = requests.get(f"{BASE_URL}/users/{user_id}")
    print_response(response)
    
    return user_id

def test_categories_endpoints():
    """Test the categories endpoints."""
    print("\n=== Testing Categories Endpoints ===")
    
    # List categories
    print("\n--- List Categories ---")
    response = requests.get(f"{BASE_URL}/categories/")
    categories = print_response(response)
    
    if not categories or not isinstance(categories, list) or len(categories) == 0:
        print("No categories found, skipping category-specific tests")
        return None
    
    # Get a specific category
    category_id = categories[0]["id"]
    print(f"\n--- Get Category {category_id} ---")
    response = requests.get(f"{BASE_URL}/categories/{category_id}")
    print_response(response)
    
    return category_id

def test_llms_endpoints():
    """Test the LLMs endpoints."""
    print("\n=== Testing LLMs Endpoints ===")
    
    # List LLMs
    print("\n--- List LLMs ---")
    response = requests.get(f"{BASE_URL}/llms/")
    llms = print_response(response)
    
    if not llms or not isinstance(llms, list) or len(llms) == 0:
        print("No LLMs found, skipping LLM-specific tests")
        return None
    
    # Get a specific LLM
    llm_id = llms[0]["id"]
    print(f"\n--- Get LLM {llm_id} ---")
    response = requests.get(f"{BASE_URL}/llms/{llm_id}")
    print_response(response)
    
    return llm_id

def main():
    """Main function to run all tests."""
    print("Starting API Tests...")
    
    # Test each endpoint group
    video_id = test_videos_endpoints()
    channel_id = test_channels_endpoints()
    transcript_id = test_transcripts_endpoints(video_id)
    digest_id = test_digests_endpoints(video_id)
    user_id = test_users_endpoints()
    category_id = test_categories_endpoints()
    llm_id = test_llms_endpoints()
    
    print("\nAPI Tests Completed!")

if __name__ == "__main__":
    main()
