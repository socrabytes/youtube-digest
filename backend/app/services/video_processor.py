import yt_dlp
from openai import OpenAI
from app.core.config import settings
from typing import Optional

class VideoProcessor:
    def __init__(self):
        self.client: Optional[OpenAI] = None
        if settings.OPENAI_API_KEY:
            self.client = OpenAI(api_key=settings.OPENAI_API_KEY)

    def extract_video_info(self, url: str) -> dict:
        ydl_opts = {
            'format': 'best',
            'extract_flat': True,
        }
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            return {
                'youtube_id': info['id'],
                'title': info['title'],
                'thumbnail_url': info.get('thumbnail'),
                'url': url
            }

    async def generate_summary(self, title: str, description: str) -> str:
        if not self.client:
            return "OpenAI API key not configured. Summary generation is disabled."

        prompt = f"""Summarize this YouTube video based on its title and description:
        Title: {title}
        Description: {description}
        
        Please provide a concise summary that captures the main points and key takeaways."""

        response = await self.client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that creates concise and informative video summaries."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=500
        )
        
        return response.choices[0].message.content
