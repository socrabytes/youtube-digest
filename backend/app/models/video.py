from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, BigInteger
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import json

Base = declarative_base()

class Video(Base):
    __tablename__ = "videos"

    id = Column(Integer, primary_key=True, index=True)
    youtube_id = Column(String(20), unique=True, nullable=True, index=True)
    title = Column(String(255), nullable=True)
    url = Column(String(255), nullable=False)
    thumbnail_url = Column(String(255), nullable=True)
    
    # Video metadata
    duration = Column(Integer, nullable=True)
    view_count = Column(BigInteger, nullable=True)
    channel_id = Column(String(50), nullable=True)
    channel_title = Column(String(255), nullable=True)
    
    # Content analysis
    _tags = Column("tags", Text, nullable=True)
    _categories = Column("categories", Text, nullable=True)
    transcript = Column(Text, nullable=True)
    sentiment_score = Column(Integer, nullable=True)
    
    # Processing status
    summary = Column(Text, nullable=True)
    processed = Column(Boolean, default=False, nullable=False)
    error_message = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    @property
    def tags(self):
        if self._tags is None:
            return []
        try:
            return json.loads(self._tags)
        except (json.JSONDecodeError, TypeError):
            return []

    @tags.setter
    def tags(self, value):
        if value is None:
            self._tags = json.dumps([])
        else:
            # Ensure all items are strings
            str_list = [str(item) for item in value if item is not None]
            self._tags = json.dumps(str_list)

    @property
    def categories(self):
        if self._categories is None:
            return []
        try:
            return json.loads(self._categories)
        except (json.JSONDecodeError, TypeError):
            return []

    @categories.setter
    def categories(self, value):
        if value is None:
            self._categories = json.dumps([])
        else:
            # Ensure all items are strings
            str_list = [str(item) for item in value if item is not None]
            self._categories = json.dumps(str_list)

    def __init__(self, **kwargs):
        # Handle tags and categories
        tags = kwargs.pop('tags', [])
        categories = kwargs.pop('categories', [])
        
        super().__init__(**kwargs)
        
        # Set tags and categories using the property setters
        self.tags = tags
        self.categories = categories
