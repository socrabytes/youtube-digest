# Transcript Processing Pattern

## Overview
Pattern for extracting and processing video transcripts using yt-dlp.

## When to Use
- Extracting video transcripts
- Processing subtitle content
- Need clean text for analysis

## Pattern Implementation

### 1. Extract Content
```python
def extract_transcript(video_url: str) -> str:
    ydl_opts = {
        'writesubtitles': True,
        'subtitlesformat': 'json3',
        'skip_download': True
    }
    
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(video_url, download=False)
        return process_transcript(info['subtitles'])
```

### 2. Process Format
```python
def process_transcript(subtitles: dict) -> str:
    # Extract text from JSON3 format
    # Clean and combine segments
    # Handle formatting and timing
    return cleaned_text
```

## Error Handling
- Missing transcripts
- Format conversion issues
- Language availability

## Example Implementation
See `backend/app/services/transcript_service.py`

## Related Patterns
- [background-tasks.md](./background-tasks.md) - For handling transcript processing in background
