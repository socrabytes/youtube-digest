"""
Pytest configuration file for the YouTube Digest API tests.
"""
import os
import pytest
from dotenv import load_dotenv
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from app.main import app
from app.db.database import Base, get_db

# Load environment variables
load_dotenv()

# Setup test database
POSTGRES_SERVER = os.getenv("POSTGRES_SERVER", "localhost")
POSTGRES_USER = os.getenv("POSTGRES_USER", "postgres")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "postgres")
POSTGRES_DB = os.getenv("POSTGRES_DB", "youtube_digest_test")

SQLALCHEMY_DATABASE_URL = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_SERVER}/{POSTGRES_DB}"


@pytest.fixture(scope="session")
def db_engine():
    """Create a SQLAlchemy engine for testing."""
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    yield engine
    engine.dispose()


@pytest.fixture(scope="session")
def db_tables(db_engine):
    """Create all tables in the test database."""
    Base.metadata.create_all(bind=db_engine)
    yield
    # In a real-world scenario, you might want to drop tables after tests
    # Base.metadata.drop_all(bind=db_engine)


@pytest.fixture
def db_session(db_engine, db_tables):
    """Create a new database session for a test."""
    connection = db_engine.connect()
    transaction = connection.begin()
    
    # Create a session bound to the connection
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=connection)
    session = TestingSessionLocal()
    
    # Begin a nested transaction
    nested = connection.begin_nested()
    
    # If the session is closed, the transaction is closed as well
    # Use SQLAlchemy event API directly
    def end_savepoint(session, transaction):
        if not nested.is_active:
            nested.begin()
    
    event.listen(session, "after_transaction_end", end_savepoint)
    
    yield session
    
    # Remove the event listener
    event.remove(session, "after_transaction_end", end_savepoint)
    
    # Rollback the transaction
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db_session):
    """Create a FastAPI TestClient with the test database session."""
    # Override the get_db dependency
    def override_get_db():
        try:
            yield db_session
        finally:
            pass  # Session is closed in the db_session fixture
    
    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as test_client:
        yield test_client
    
    # Remove the override after the test
    app.dependency_overrides.clear()


# Test data fixtures
@pytest.fixture
def test_channel():
    """Test channel data."""
    return {
        "youtube_channel_id": "UC_test123",
        "name": "Test Channel",
        "thumbnail_url": "https://example.com/thumbnail.jpg",
        "subscriber_count": 1000,
        "channel_url": "https://www.youtube.com/channel/UC_test123"
    }


@pytest.fixture
def test_video():
    """Test video data."""
    return {
        "youtube_id": "dQw4w9WgXcQ",
        "title": "Test Video",
        "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "webpage_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "thumbnail_url": "https://example.com/thumbnail.jpg",
        "thumbnail": "https://example.com/thumbnail.jpg",
        "duration": 212,
        "view_count": 10000,
        "like_count": 5000,
        "description": "This is a test video",
        "tags": ["test", "video"],
        "categories": ["Entertainment"],
        "processing_status": "pending"
    }


@pytest.fixture
def test_transcript():
    """Test transcript data."""
    return {
        "content": "This is a test transcript content.",
        "source_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "status": "PROCESSED"
    }


@pytest.fixture
def test_digest():
    """Test digest data."""
    return {
        "content": "This is a test digest summary.",
        "type": "summary",
        "status": "PROCESSED",
        "tokens_used": 100,
        "cost": 0.002,
        "model_version": "gpt-4"
    }


@pytest.fixture
def test_user():
    """Test user data."""
    return {
        "username": "testuser",
        "email": "test@example.com"
    }


@pytest.fixture
def test_category():
    """Test category data."""
    return {
        "youtube_category_id": "22",
        "name": "Entertainment",
        "description": "Entertainment videos"
    }


@pytest.fixture
def test_llm():
    """Test LLM data."""
    return {
        "name": "gpt-4",
        "description": "OpenAI GPT-4 model",
        "base_cost_per_token": 0.00006
    }
