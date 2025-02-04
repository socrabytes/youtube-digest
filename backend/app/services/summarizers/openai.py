from openai import OpenAI
import json
import logging
from typing import Dict, Any
from app.core.config import settings

logger = logging.getLogger(__name__)

class SummaryGenerationError(Exception):
    """Base exception for summary generation errors."""
    pass

class OpenAISummarizer:
    def __init__(self):
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
        self.system_prompt = """You are an expert YouTube video summarizer. 
Generate a concise summary that:
1. Identifies 3-5 key topics
2. Highlights surprising/revelatory moments
3. Explains technical concepts in lay terms
4. Ends with overall significance/impact
Keep under 250 words."""

    def generate(self, transcript: str) -> Dict[str, Any]:
        """Generate summary from transcript text."""
        try:
            # Truncate text to avoid token limits
            truncated_text = transcript[:15000]
            
            response = self.client.chat.completions.create(
                model="gpt-4-turbo",
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": truncated_text}
                ],
                temperature=0.2,
                max_tokens=500
            )
            
            return {
                "summary": response.choices[0].message.content,
                "usage": json.loads(response.json())['usage']
            }
            
        except Exception as e:
            logger.error(f"OpenAI summarization failed: {str(e)}")
            raise SummaryGenerationError(f"Failed to generate summary: {str(e)}")
