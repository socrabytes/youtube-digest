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
        logger.info(f"Initializing OpenAISummarizer with API key present: {bool(settings.OPENAI_API_KEY)}")
        if not settings.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY is not set in environment variables")
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
            logger.info("Starting summary generation")
            # Truncate text to avoid token limits
            truncated_text = transcript[:15000]
            logger.info(f"Transcript length: {len(transcript)}, truncated length: {len(truncated_text)}")
            
            logger.info("Calling OpenAI API")
            response = self.client.chat.completions.create(
                model="gpt-4-turbo",
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": truncated_text}
                ],
                temperature=0.2,
                max_tokens=500
            )
            logger.info("Received response from OpenAI API")
            
            result = {
                "summary": response.choices[0].message.content,
                "usage": {
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                    "total_tokens": response.usage.total_tokens
                }
            }
            logger.info(f"Generated summary with {result['usage']['total_tokens']} total tokens")
            return result
            
        except Exception as e:
            logger.error(f"OpenAI summarization failed: {str(e)}", exc_info=True)
            raise SummaryGenerationError(f"Failed to generate summary: {str(e)}")
