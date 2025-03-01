import pytest
from app.models.channel import Channel
from app.models.video import Video, ProcessingStatus
from app.models.transcript import Transcript, TranscriptStatus
from app.models.digest import Digest, DigestType
from app.models.user import User
from app.models.category import Category
from app.models.llm import LLM
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from datetime import datetime

# Test data fixtures
# These are imported from conftest.py automatically by pytest

# Setup test database with initial data
@pytest.fixture(autouse=True)
def setup_db(db_session, test_channel, test_video, test_transcript, test_digest, test_user, test_category, test_llm):
    """Set up test database with initial data."""
    # Create test data in DB
    db = db_session
    
    # Clear all tables
    db.query(Digest).delete()
    db.query(Transcript).delete()
    db.query(Video).delete()
    db.query(Channel).delete()
    db.query(User).delete()
    db.query(Category).delete()
    db.query(LLM).delete()
    
    # Create test channel
    channel = Channel(
        youtube_channel_id=test_channel["youtube_channel_id"],
        name=test_channel["name"],
        thumbnail_url=test_channel["thumbnail_url"],
        subscriber_count=test_channel["subscriber_count"],
        channel_url=test_channel["channel_url"]
    )
    db.add(channel)
    db.commit()
    
    # Create test video
    video = Video(
        youtube_id=test_video["youtube_id"],
        title=test_video["title"],
        webpage_url=test_video["webpage_url"],
        thumbnail=test_video["thumbnail"],
        duration=test_video["duration"],
        view_count=test_video["view_count"],
        like_count=test_video["like_count"],
        description=test_video["description"],
        tags=test_video["tags"],
        categories=test_video["categories"],
        channel_id=channel.id,
        processing_status=ProcessingStatus.PENDING
    )
    db.add(video)
    db.commit()
    
    # Create test user
    user = User(
        username=test_user["username"],
        email=test_user["email"]
    )
    db.add(user)
    db.commit()
    
    # Create test LLM
    llm = LLM(
        name=test_llm["name"],
        description=test_llm["description"],
        base_cost_per_token=test_llm["base_cost_per_token"]
    )
    db.add(llm)
    db.commit()
    
    # Create test transcript
    transcript = Transcript(
        video_id=video.id,
        content=test_transcript["content"],
        source_url=test_transcript["source_url"],
        status=TranscriptStatus.PROCESSED
    )
    db.add(transcript)
    db.commit()
    
    # Create test digest
    digest = Digest(
        video_id=video.id,
        digest=test_digest["content"],
        digest_type=DigestType.SUMMARY,
        tokens_used=test_digest["tokens_used"],
        cost=test_digest["cost"],
        model_version=test_digest["model_version"],
        user_id=user.id,
        llm_id=llm.id,
        generated_at=datetime.utcnow()
    )
    db.add(digest)
    db.commit()
    
    # Create test category
    category = Category(
        youtube_category_id=test_category["youtube_category_id"],
        name=test_category["name"],
        description=test_category["description"]
    )
    db.add(category)
    db.commit()
    
    # Return the session for use in tests
    return db

# Tests for Channels API
def test_list_channels(client, test_channel):
    response = client.get("/api/v1/channels/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    assert data[0]["youtube_channel_id"] == test_channel["youtube_channel_id"]

def test_get_channel(client, test_channel):
    # First get all channels to get an ID
    response = client.get("/api/v1/channels/")
    channels = response.json()
    channel_id = channels[0]["id"]
    
    response = client.get(f"/api/v1/channels/{channel_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["youtube_channel_id"] == test_channel["youtube_channel_id"]

def test_get_channel_by_youtube_id(client, test_channel):
    response = client.get("/api/v1/channels/youtube/" + test_channel["youtube_channel_id"])
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == test_channel["name"]

# Tests for Videos API
def test_list_videos(client, test_video):
    response = client.get("/api/v1/videos/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    assert data[0]["youtube_id"] == test_video["youtube_id"]

def test_get_video(client, test_video):
    # First get all videos to get an ID
    response = client.get("/api/v1/videos/")
    videos = response.json()
    video_id = videos[0]["id"]
    
    response = client.get(f"/api/v1/videos/{video_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["youtube_id"] == test_video["youtube_id"]

def test_get_video_by_youtube_id(client, test_video):
    response = client.get("/api/v1/videos/youtube/" + test_video["youtube_id"])
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == test_video["title"]

# Tests for Transcripts API
def test_list_transcripts(client, test_transcript):
    response = client.get("/api/v1/transcripts/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    assert "content" in data[0]

def test_get_transcript(client, test_transcript):
    # First get all transcripts to get an ID
    response = client.get("/api/v1/transcripts/")
    transcripts = response.json()
    transcript_id = transcripts[0]["id"]
    
    response = client.get(f"/api/v1/transcripts/{transcript_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["content"] == test_transcript["content"]

def test_get_video_transcripts(client):
    # First get all videos to get an ID
    response = client.get("/api/v1/videos/")
    videos = response.json()
    video_id = videos[0]["id"]
    
    response = client.get(f"/api/v1/videos/{video_id}/transcripts")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    assert "content" in data[0]

# Tests for Digests API
def test_list_digests(client, setup_db):
    """Test listing all digests."""
    response = client.get("/api/v1/digests/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    assert "digest" in data[0]

def test_get_digest(client, setup_db):
    """Test getting a specific digest."""
    # First get all digests to get an ID
    response = client.get("/api/v1/digests/")
    digests = response.json()
    digest_id = digests[0]["id"]
    
    response = client.get(f"/api/v1/digests/{digest_id}")
    assert response.status_code == 200
    data = response.json()
    # Just check that the digest field exists and is not empty
    assert "digest" in data
    assert data["digest"]

def test_get_video_digests(client, setup_db):
    """Test getting all digests for a video."""
    # First get all videos to get an ID
    response = client.get("/api/v1/videos/")
    videos = response.json()
    video_id = videos[0]["id"]
    
    response = client.get(f"/api/v1/videos/{video_id}/digests")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    assert "digest" in data[0]

# Tests for Users API
def test_list_users(client, test_user):
    response = client.get("/api/v1/users/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    assert data[0]["username"] == test_user["username"]

def test_get_user(client, test_user):
    # First get all users to get an ID
    response = client.get("/api/v1/users/")
    users = response.json()
    user_id = users[0]["id"]
    
    response = client.get(f"/api/v1/users/{user_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == test_user["email"]

# Tests for Categories API
def test_list_categories(client, test_category):
    response = client.get("/api/v1/categories/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    assert data[0]["name"] == test_category["name"]

def test_get_category(client, test_category):
    # First get all categories to get an ID
    response = client.get("/api/v1/categories/")
    categories = response.json()
    category_id = categories[0]["id"]
    
    response = client.get(f"/api/v1/categories/{category_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["youtube_category_id"] == test_category["youtube_category_id"]

# Tests for LLMs API
def test_list_llms(client, test_llm):
    response = client.get("/api/v1/llms/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    assert data[0]["name"] == test_llm["name"]

def test_get_llm(client, test_llm):
    # First get all LLMs to get an ID
    response = client.get("/api/v1/llms/")
    llms = response.json()
    llm_id = llms[0]["id"]
    
    response = client.get(f"/api/v1/llms/{llm_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["description"] == test_llm["description"]
