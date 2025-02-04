# AI Video Summarization

## Overview
YouTube Digest uses OpenAI's GPT-4 to automatically generate concise, informative summaries of YouTube videos based on their transcripts.

## Features
- Automatic transcript extraction and processing
- AI-powered summary generation
- Cost-effective token usage
- Background processing with status updates

## Usage

### Adding a Video for Summarization
1. Enter the YouTube video URL
2. The system will automatically:
   - Extract video metadata
   - Download and process the transcript
   - Generate an AI summary
   - Display the results

### Viewing Summaries
- Summaries appear in the video card
- Loading states indicate processing
- Error messages if summarization fails

## Technical Details

### API Endpoints
```
POST /api/v1/videos/{video_id}/summary
GET /api/v1/videos/{video_id}/summary/status
```

### Response Format
```json
{
    "summary": "Generated summary text",
    "token_usage": {
        "prompt_tokens": 500,
        "completion_tokens": 200,
        "total_tokens": 700
    }
}
```

## Error Handling
- Clear error messages for common issues
- Automatic retries for transient failures
- Rate limit compliance

## Limitations
- Requires video to have available transcripts
- English language support only
- Maximum video length: 2 hours
