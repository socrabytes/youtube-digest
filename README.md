# YouTube Video Digest Platform

Transform YouTube videos into comprehensive, interactive digests powered by AI.

## ✨ Features

- 🎥 **Video Analysis**: Submit any YouTube video URL
- 🤖 **AI-Powered Summaries**: Get intelligent summaries of video content
- 🖼️ **Visual Preview**: See video thumbnails and metadata
- 📊 **Comprehensive Details**: View duration, channel info, and more

## 🚀 Getting Started

### Prerequisites

- Docker and Docker Compose
- OpenAI API key

### Quick Start

1. Clone the repository:
```bash
git clone <repository-url>
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

## 💡 Usage

1. Visit the homepage
2. Paste a YouTube video URL
3. Click "Create Digest"
4. View your video digest with AI-generated insights

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, TailwindCSS
- **Backend**: FastAPI, PostgreSQL, OpenAI
- **Infrastructure**: Docker

## 📝 Development

For development status, progress, and contribution guidelines, see:
- [DEVELOPMENT.md](DEVELOPMENT.md) - Current development status
- [CHANGELOG.md](CHANGELOG.md) - Version history

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
