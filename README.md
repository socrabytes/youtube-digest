# YouTube Video Digest

Transform YouTube videos into comprehensive, AI-powered summaries using OpenAI's GPT-4.

## 🎥 What it does

- **Video Analysis**: Enter any YouTube URL, get an AI-generated summary
- **Smart Summaries**: Uses GPT-4 to create concise, informative video summaries
- **Automatic Processing**: Handles transcript extraction and processing
- **Cost Tracking**: Monitors OpenAI token usage and costs

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- OpenAI API key

### Setup

1. Clone the repository:
```bash
git clone https://github.com/socrabytes/youtube-digest.git
cd youtube-digest
```

2. Create environment files:

```bash
# Backend (.env)
OPENAI_API_KEY=your_api_key
DATABASE_URL=postgresql://postgres:postgres@db:5432/youtube_digest

# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:8000
```

3. Start the application:
```bash
docker-compose up
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Using the App

1. Enter a YouTube URL in the input field
2. Click "Create Digest"
3. Wait for the AI to process the video
4. View your generated summary

## 🏗️ Current State

This project is under active development. Currently working:
- ✅ YouTube video URL processing
- ✅ Transcript extraction
- ✅ OpenAI GPT-4 integration
- ✅ Basic summary generation
- ✅ Docker development environment

## 📚 Documentation

Detailed documentation available in the `/docs` directory:
- [Features](./docs/features/ai-video-summarization.md)
- [Development Patterns](./docs/patterns/)
