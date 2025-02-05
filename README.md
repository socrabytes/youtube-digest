# YouTube Video Digest

Transform YouTube videos into comprehensive, AI-powered summaries using OpenAI's GPT-4.

## 🚧 Project Status

This is an open-source project under active development. Track our progress and upcoming features on our [GitHub Projects board](https://github.com/users/socrabytes/projects/6/views/7).

## 🎥 What it does

- **Video Analysis**: Enter any YouTube URL, get an AI-generated summary
- **Smart Summaries**: Uses GPT-4 to create concise, informative video summaries
- **Automatic Processing**: Handles transcript extraction and processing
- **Cost Tracking**: Monitors OpenAI token usage and costs

## 🛠️ Tech Stack

### Backend
- **Framework**: FastAPI (Python 3.11+)
- **Database**: PostgreSQL with SQLAlchemy
- **AI**: OpenAI GPT-4 API
- **Video Processing**: yt-dlp for YouTube integration

### Frontend
- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **Components**: Shadcn UI
- **State Management**: React Query

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Testing**: pytest (backend), Jest (frontend)
- **CI/CD**: GitHub Actions

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

## 📚 Documentation

Our documentation is organized into several sections in the `/docs` directory:

### Core Documentation
- [Features](./docs/features/ai-video-summarization.md) - Detailed feature explanations and usage guides
- [Development Patterns](./docs/patterns/README.md) - Code organization and best practices
  - [OpenAI Integration](./docs/patterns/openai-integration.md)
  - [Background Tasks](./docs/patterns/background-tasks.md)
  - [Transcript Processing](./docs/patterns/transcript-processing.md)

### Development
- [Project Board](./docs/workflow/github-projects.md) - Track development progress
- [Tasks](./docs/tasks/) - Implementation details for specific features
