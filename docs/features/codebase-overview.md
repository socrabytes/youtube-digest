# YouTube Digest — Codebase Overview

This document provides a concise map of the system to help you navigate and extend the project quickly.

## Architecture
- Frontend: Next.js (TypeScript, Tailwind)
- Backend: FastAPI (Python 3.11+)
- Database: PostgreSQL (SQLAlchemy ORM)
- AI: OpenAI (o3-mini) summarization with cost tracking
- Infra: Docker Compose for local runtime; local venv for dev tooling

## Processing Flow
1. Submit YouTube URL via frontend.
2. Backend validates URL and stores video metadata (`yt-dlp`).
3. Background tasks fetch transcript and chapters.
4. User requests digest; background task generates AI summary.
5. Data stored in Postgres; frontend displays digest and chapters.

## Backend Layout (`backend/app/`)
- `main.py` — FastAPI app, CORS, logging, include routers
- `api/v1/` — HTTP endpoints
  - `videos.py` — submit/list/get videos; background processing
  - `transcripts.py` — create/list/get transcripts; background extraction
  - `digests.py` — create/list/get digests; background summarization
  - `router.py` — aggregates v1 routers
- `services/`
  - `video_processor.py` — orchestrates yt-dlp, chapters, transcript kick-off
  - `transcript_service.py` — finds/downloads/parses subtitles (e.g., JSON3)
  - `summarizers/openai_summarizer.py` — OpenAI integration, retries, rate limits, cost tracking
- `models/`
  - `video.py`, `transcript.py`, `digest.py`, `channel.py` — SQLAlchemy ORM models

### Data and Conventions
- JSONB: tags, chapters, channel metadata, OpenAI usage
- Timestamps: `created_at`, `updated_at`, plus action-specific (e.g., `processed_at`)
- Status enums: PENDING/PROCESSING/COMPLETED/FAILED across entities
- Errors: `error_message` fields + JSONB logs
- Field mapping in API responses (compatibility layer):
  - `video.webpage_url` → API `url`
  - `video.thumbnail` → API `thumbnail_url`
  - `digest.content` → API `digest`

## Frontend Layout (`frontend/`)
- `src/app/page.tsx` — main page (submit URL, navigate to digest)
- `src/components/video/VideoCard.tsx` — video display, thumbnail fallback
- `src/types/video.ts` — typed API models
- `src/utils/format.ts` — `formatDuration`, `formatViews`, `formatDate`
- `eslint.config.mjs` — ESLint config

## Running Locally
- Runtime (Docker): `docker-compose up`
- Secrets: `.env` files (not committed)
  - Backend: `backend/.env` — `OPENAI_API_KEY`, `DATABASE_URL`
  - Frontend: `frontend/.env.local` — `NEXT_PUBLIC_API_URL`
- Dev tooling (local venv): see `docs/workflow/github-projects.md` and Development Environment Setup

## Extending Safely
1. Define the change and choose the simplest approach.
2. Backend: service → migration → model → API mapping → tests → docs.
3. Frontend: update types → API wrapper → component(s) → tests → docs.
4. Follow Gitmoji for commits; one logical change per PR.

## References
- `README.md` — overview and quick start
- `docs/patterns/` — reusable patterns (OpenAI, background tasks, transcripts)
- `docs/tasks/` — implementation notes and lessons
- `docs/workflow/` — branch/PR flow, GitHub Projects
