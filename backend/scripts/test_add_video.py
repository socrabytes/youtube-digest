#!/usr/bin/env python
import requests
import json
import time

def test_add_video_with_chapters():
    """Test function to add a video with chapters and check if they're properly stored"""
    # Video URL for a YouTube video known to have chapters
    video_url = "https://www.youtube.com/watch?v=yfoY53QXEnI"  # CSS tutorial with chapters
    
    print(f"Testing adding video with chapters: {video_url}")
    
    # Submit the video to the API
    try:
        response = requests.post(
            "http://backend:8000/api/v1/videos/",
            json={"url": video_url}
        )
        
        print(f"POST Response Status: {response.status_code}")
        
        if response.status_code == 200 or response.status_code == 201:
            # Get the video ID from the response
            video_data = response.json()
            video_id = video_data["id"]
            
            print(f"Video added with ID: {video_id}")
            
            # Wait for processing to complete (with a reasonable timeout)
            max_retries = 30
            for i in range(max_retries):
                # Check the video status
                get_response = requests.get(f"http://backend:8000/api/v1/videos/{video_id}")
                
                if get_response.status_code == 200:
                    video_data = get_response.json()
                    status = video_data.get("processing_status", "")
                    
                    print(f"Processing status: {status} (attempt {i+1}/{max_retries})")
                    
                    # Check if chapters are populated
                    chapters = video_data.get("chapters", None)
                    if chapters:
                        print("Chapters found:")
                        print(json.dumps(chapters, indent=2))
                        return True
                        
                    if status == "COMPLETED":
                        print("Processing completed, final video data:")
                        print(json.dumps(video_data, indent=2))
                        return video_data
                        
                    if status == "FAILED":
                        print("Processing failed")
                        print(f"Error message: {video_data.get('error_message', 'No error message')}")
                        return False
                
                # Wait before checking again
                time.sleep(2)
            
            print("Timed out waiting for processing to complete")
            return False
        else:
            print(f"Error adding video: {response.text}")
            return False
            
    except Exception as e:
        print(f"Error in test: {str(e)}")
        return False

if __name__ == "__main__":
    test_add_video_with_chapters()
