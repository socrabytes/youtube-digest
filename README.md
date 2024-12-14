# YouTube Video Digest Platform

An intelligent platform that automatically processes YouTube videos to create comprehensive, interactive digests.

## Current Status

✅ **Phase 1: Basic Infrastructure** (Completed)
- Frontend setup with Next.js and TypeScript
- Backend API with FastAPI
- Video submission form with thumbnail display
- Basic video metadata storage

✅ **Phase 2: Video Processing** (Completed)
- OpenAI integration for summaries
- PostgreSQL database implementation
- Enhanced video metadata handling
- Containerized development environment

## Tech Stack

### Backend
- Python 3.11+
- FastAPI
- PostgreSQL
- OpenAI API
- Docker

### Frontend
- Next.js 14
- TypeScript
- TailwindCSS
- React
- Docker

## Getting Started

### Prerequisites
- Docker and Docker Compose
- OpenAI API key

### Environment Setup

1. Clone the repository
```bash
git clone <repository-url>
cd youtube-digest
```

2. Set up environment files:

Backend (.env):
```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your OpenAI API key and other settings
```

Frontend (.env.local):
```bash
cp frontend/.env.example frontend/.env.local
```

### Running with Docker

1. Start all services:
```bash
docker-compose up
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

### Stopping the Application

1. To stop while preserving data:
```bash
docker-compose down
```

2. To stop and remove all data (including database):
```bash
docker-compose down -v
```

### Development

The setup includes hot-reload for both frontend and backend:
- Frontend changes will automatically refresh
- Backend changes will trigger automatic restart
- Database data persists between restarts

## Next Steps

1. Video Processing
   - Implement OpenAI integration for generating summaries
   - Set up PostgreSQL for persistent storage
   - Add video metadata extraction

2. Frontend Enhancements
   - Add summary display component
   - Implement video filtering and search
   - Add user authentication (optional)

## Contributing

Please follow our commit message convention using gitmoji:
- Format: <emoji> (scope): <message>
- Example: 🐛 (backend): Fix OpenAI integration
