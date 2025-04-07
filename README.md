# 🎬 YouTube Video Digest 
<img src="docs/digest-icon.png" align="right" width="180" height="180" alt="YouTube Digest Icon">

[![Project Status: Active](https://img.shields.io/badge/Project-Active-success.svg)](https://github.com/users/socrabytes/projects/6/views/7)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Transform YouTube videos into comprehensive, AI-powered summaries using OpenAI's GPT-4. Get the essence of any video without watching the whole thing.

## ✨ Key Features

- 🧠 **Smart Summaries** - Concise, informative video digests using GPT-4
- 📝 **Full Transcripts** - Access complete video transcripts
- ⏱️ **Interactive Timestamps** - Click timestamps to jump to specific video moments
- 📑 **Chapter Navigation** - Easily navigate videos using extracted chapter data
- 🔄 **Automatic Processing** - Handles transcript extraction and processing
- 💰 **Cost Tracking** - Monitors OpenAI token usage and costs

<!-- Add a GIF demo here once created -->
<!-- <p align="center"><img src="docs/demo.gif" width="600" alt="YouTube Digest Demo"></p> -->

## 🛠️ Tech Stack

<table>
  <tr>
    <td><strong>Backend</strong></td>
    <td>
      <img src="https://img.shields.io/badge/Python-3.11+-blue?logo=python&logoColor=white" alt="Python" />
      <img src="https://img.shields.io/badge/FastAPI-0.100+-green?logo=fastapi&logoColor=white" alt="FastAPI" />
      <img src="https://img.shields.io/badge/PostgreSQL-15-blue?logo=postgresql&logoColor=white" alt="PostgreSQL" />
      <img src="https://img.shields.io/badge/OpenAI-GPT_4-green?logo=openai&logoColor=white" alt="OpenAI" />
      <img src="https://img.shields.io/badge/yt--dlp-Latest-red?logo=youtube&logoColor=white" alt="yt-dlp" />
    </td>
  </tr>
  <tr>
    <td><strong>Frontend</strong></td>
    <td>
      <img src="https://img.shields.io/badge/Next.js-14-black?logo=next.js&logoColor=white" alt="Next.js" />
      <img src="https://img.shields.io/badge/TypeScript-5-blue?logo=typescript&logoColor=white" alt="TypeScript" />
      <img src="https://img.shields.io/badge/Tailwind_CSS-3-blue?logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
      <img src="https://img.shields.io/badge/Shadcn_UI-Latest-black?logo=react&logoColor=white" alt="Shadcn UI" />
      <img src="https://img.shields.io/badge/React_Query-Latest-ff4154?logo=react-query&logoColor=white" alt="React Query" />
    </td>
  </tr>
  <tr>
    <td><strong>Infrastructure</strong></td>
    <td>
      <img src="https://img.shields.io/badge/Docker-Compose-blue?logo=docker&logoColor=white" alt="Docker" />
      <img src="https://img.shields.io/badge/pytest-Latest-blue?logo=pytest&logoColor=white" alt="pytest" />
      <img src="https://img.shields.io/badge/Jest-Latest-C21325?logo=jest&logoColor=white" alt="Jest" />
      <img src="https://img.shields.io/badge/GitHub_Actions-CI/CD-2088FF?logo=github-actions&logoColor=white" alt="GitHub Actions" />
    </td>
  </tr>
</table>

## 💡 How It Works

<table>
  <tr>
    <td width="60%">
      <ol>
        <li>Paste a YouTube URL in the input field</li>
        <li>Our backend fetches video metadata and transcript using <code>yt-dlp</code></li>
        <li>A background task processes the transcript and generates an AI summary</li>
        <li>Chapters are automatically extracted when available</li>
        <li>The frontend displays your digest with interactive timestamps</li>
      </ol>
    </td>
    <td width="40%" align="center">
      <!-- Replace with actual GIF when available -->
      <em>Demo GIF coming soon</em>
      <!-- <img src="docs/demo.gif" width="100%" alt="YouTube Digest Demo" /> -->
    </td>
  </tr>
</table>

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

<table>
  <tr>
    <td width="50%"><strong>Core Documentation</strong></td>
    <td width="50%"><strong>Development Resources</strong></td>
  </tr>
  <tr>
    <td>
      <ul>
        <li><a href="./docs/features/ai-video-summarization.md">Features</a> - Detailed feature explanations</li>
        <li><a href="./docs/patterns/README.md">Development Patterns</a> - Code organization</li>
        <li><a href="./docs/patterns/openai-integration.md">OpenAI Integration</a> - AI implementation</li>
        <li><a href="./docs/patterns/background-tasks.md">Background Tasks</a> - Async processing</li>
        <li><a href="./docs/patterns/transcript-processing.md">Transcript Processing</a> - Video data extraction</li>
      </ul>
    </td>
    <td>
      <ul>
        <li><a href="./docs/workflow/github-projects.md">Project Board</a> - Track development progress</li>
        <li><a href="./docs/tasks/">Tasks</a> - Implementation details for specific features</li>
        <li><a href="https://github.com/users/socrabytes/projects/6/views/7">GitHub Projects</a> - Current sprint and backlog</li>
      </ul>
    </td>
  </tr>
</table>

## 🤝 Contributing

Contributions are welcome! Please follow our [Gitmoji commit convention](./docs/workflow/github-projects.md) and check the project board for current priorities.
