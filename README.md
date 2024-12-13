# YouTube Video Digest Platform

An intelligent platform that automatically processes YouTube videos to create comprehensive, interactive digests.

## Features

- Automated video transcript processing
- Key frame extraction
- AI-powered summarization
- Interactive web interface
- RESTful API

## Tech Stack

### Backend
- Python 3.11+
- FastAPI
- PostgreSQL
- youtube-dl
- OpenAI API

### Frontend
- Next.js 14
- TailwindCSS
- TypeScript

## Project Structure

```
youtube-digest/
├── backend/           # FastAPI application
│   ├── app/
│   │   ├── api/      # API endpoints
│   │   ├── core/     # Core functionality
│   │   ├── models/   # Database models
│   │   └── services/ # Business logic
│   ├── tests/        # Backend tests
│   └── alembic/      # Database migrations
├── frontend/         # Next.js application
│   ├── app/         # Next.js pages
│   ├── components/  # React components
│   └── styles/      # TailwindCSS styles
└── docker/          # Docker configuration
```

## Getting Started

1. Clone the repository
2. Set up environment variables
3. Start the development environment with Docker
4. Access the application at http://localhost:3000

## Development

### Prerequisites
- Docker and Docker Compose
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+

### Environment Setup
1. Copy `.env.example` to `.env`
2. Configure environment variables
3. Run `docker-compose up`

## Contributing

Please follow our contribution guidelines and use Gitmoji for commit messages:
- Format: <emoji> (scope): <message>
- Body: Add paths or specific changes for clarity
