#!/usr/bin/env python
import yt_dlp
import json

def test_extract_chapters(url):
    """Test function to extract chapters from a YouTube video"""
    print(f"Testing chapter extraction for URL: {url}")
    
    # Configure yt-dlp options
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'extract_flat': False,  # Need full info to get chapters
    }
    
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        # Extract video information
        try:
            info = ydl.extract_info(url, download=False)
            
            # Check if chapters exist
            chapters = info.get('chapters', [])
            
            print(f"Found {len(chapters)} chapters")
            
            if chapters:
                print("\nRaw chapters data:")
                print(json.dumps(chapters, indent=2))
                
                # Process chapters into our format
                processed_chapters = []
                for chapter in chapters:
                    start_time = chapter.get('start_time')
                    title = chapter.get('title')
                    
                    # Skip if missing essential data
                    if start_time is None or not title:
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
                
                print("\nProcessed chapters data:")
                print(json.dumps(processed_chapters, indent=2))
            else:
                print("No chapters found in this video")
            
            return processed_chapters
            
        except Exception as e:
            print(f"Error extracting video info: {str(e)}")
            return []

if __name__ == "__main__":
    # Test with some sample videos known to have chapters
    # Video about Redis from the user's database
    test_extract_chapters("https://www.youtube.com/watch?v=npnagMgbruc")
    
    # Video with known chapters (YouTube tutorial that likely has chapters)
    test_extract_chapters("https://www.youtube.com/watch?v=yfoY53QXEnI")
