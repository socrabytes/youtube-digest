# YouTube Video Digest Platform

An intelligent platform that automatically processes YouTube videos to create comprehensive, interactive digests.

## Current Status

✅ **Phase 1: Basic Infrastructure** (Completed)
- Frontend setup with Next.js and TypeScript
- Backend API with FastAPI
- Video submission form with thumbnail display
- Basic video metadata storage

🚧 **Phase 2: Video Processing** (Next Up)
- OpenAI integration for summaries
- PostgreSQL database implementation
- Enhanced video metadata handling

## Tech Stack

### Backend
- Python 3.11+
- FastAPI
- PostgreSQL (planned)
- OpenAI API (planned)

### Frontend
- Next.js 14
- TypeScript
- TailwindCSS
- React

## Getting Started

### Prerequisites
- Node.js 18+ for frontend
- Python 3.11+ for backend
- PostgreSQL (coming soon)

### Environment Setup

1. Backend Setup
```bash
cd backend
# Create and activate virtual environment (optional but recommended)
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your configuration
```

2. Frontend Setup
```bash
cd frontend
# Install dependencies
npm install

# Create .env.local file
cp .env.example .env.local
# Edit .env.local with your configuration
```

### Running the Application

1. Start the Backend
```bash
cd backend
uvicorn app.main:app --reload
```

2. Start the Frontend (in a new terminal)
```bash
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

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
- Example: ✨ (frontend): Add video submission form
