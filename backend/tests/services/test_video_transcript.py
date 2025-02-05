import pytest
from unittest.mock import patch, MagicMock
from app.services.video_transcript import TranscriptService, VideoTranscriptError, TranscriptNotFoundError

@pytest.fixture
def mock_yt_dlp():
    with patch('yt_dlp.YoutubeDL') as mock:
        yield mock

def test_extract_transcript_success(mock_yt_dlp):
    """Test successful transcript extraction."""
    # Mock successful response
    mock_info = {
        'subtitles': {'en': [{'data': {'events': [{'segs': [{'utf8': 'Test transcript'}]}]}}]},
        'duration': 120
    }
    mock_yt_dlp.return_value.__enter__.return_value.extract_info.return_value = mock_info
    
    url = "https://www.youtube.com/watch?v=test123"
    transcript, metadata = TranscriptService.extract_transcript(url)
    
    assert transcript == "Test transcript"
    assert metadata["language"] == "en"
    assert metadata["duration"] == 120
    assert metadata["source"] == "manual"

def test_extract_transcript_invalid_url(mock_yt_dlp):
    """Test transcript extraction with invalid URL."""
    mock_yt_dlp.return_value.__enter__.return_value.extract_info.side_effect = Exception("Invalid URL")
    
    with pytest.raises(VideoTranscriptError):
        TranscriptService.extract_transcript("https://youtube.com/invalid")

def test_extract_transcript_no_subtitles(mock_yt_dlp):
    """Test handling of videos without subtitles."""
    mock_info = {
        'subtitles': {},
        'automatic_captions': {},
        'duration': 120
    }
    mock_yt_dlp.return_value.__enter__.return_value.extract_info.return_value = mock_info
    
    with pytest.raises(TranscriptNotFoundError):
        TranscriptService.extract_transcript("https://www.youtube.com/watch?v=no_subs")
