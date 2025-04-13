from openai import OpenAI
import json
import logging
import time
from functools import wraps
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from threading import Lock
from typing import Dict, Any, List, Optional
from enum import Enum
from app.core.config import settings
from datetime import datetime
from .base import SummarizerInterface, SummaryFormat, SummaryGenerationError

logger = logging.getLogger(__name__)

class RateLimiter:
    """Rate limiter using a sliding window."""
    def __init__(self, calls_per_minute: int):
        self.calls_per_minute = calls_per_minute
        self.window_size = 60  # 1 minute in seconds
        self.min_interval = self.window_size / self.calls_per_minute
        self.calls = []
        self.lock = Lock()

    def __enter__(self):
        with self.lock:
            now = time.time()
            # Remove calls older than window_size
            self.calls = [t for t in self.calls if now - t < self.window_size]
            
            if self.calls:  # If we have previous calls
                time_since_last = now - self.calls[-1]
                if time_since_last < self.min_interval:
                    sleep_time = self.min_interval - time_since_last
                    logger.info(f"Rate limit reached. Waiting {sleep_time:.2f} seconds")
                    time.sleep(sleep_time)
                    now = time.time()  # Update time after sleep
            
            self.calls.append(now)

    def __exit__(self, exc_type, exc_val, exc_tb):
        pass

class OpenAISummarizer(SummarizerInterface):
    # Token cost per 1k tokens (in USD) for o3-mini
    TOKEN_COST_PER_1K = {
        "prompt": 0.0011,    # Input tokens (o3-mini) - $1.10 per 1M tokens
        "completion": 0.0044  # Output tokens (o3-mini) - $4.40 per 1M tokens
    }

    def __init__(self):
        logger.info(f"Initializing OpenAISummarizer with API key present: {bool(settings.OPENAI_API_KEY)}")
        # Use a mock API key if not set in environment
        api_key = settings.OPENAI_API_KEY or "sk-mock-key-for-development"
        self.client = OpenAI(api_key=api_key)
        self.rate_limiter = RateLimiter(calls_per_minute=50)  # OpenAI's default RPM limit

    def calculate_cost(self, prompt_tokens: int, completion_tokens: int) -> float:
        """Calculate the cost of the API call in USD."""
        prompt_cost = (prompt_tokens / 1000) * self.TOKEN_COST_PER_1K["prompt"]
        completion_cost = (completion_tokens / 1000) * self.TOKEN_COST_PER_1K["completion"]
        return prompt_cost + completion_cost

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10),
        retry=retry_if_exception_type(Exception)
    )
    def _call_openai_api(self, messages: List[Dict[str, str]], max_tokens: int = 3000) -> Dict[str, Any]:
        """Make an API call to OpenAI with retry logic and rate limiting."""
        model_name = "o3-mini" # Define the model to use
        try:
            logger.info(f"Calling OpenAI API with model: {model_name} with max_tokens={max_tokens}") # Log model and max_tokens
            
            api_params = {
                "model": model_name,
                "messages": messages,
                "max_tokens": max_tokens # Default parameter name
            }
            
            # Add parameters specific to o3-mini based on the latest example and error message
            if model_name == "o3-mini":
                # o3-mini uses max_completion_tokens instead of max_tokens
                if "max_tokens" in api_params:
                    max_val = api_params.pop("max_tokens")
                    api_params["max_completion_tokens"] = max_val
                    logger.info(f"Switched max_tokens to max_completion_tokens={max_val} for o3-mini")
                else: # Should not happen based on current logic, but good practice
                    api_params["max_completion_tokens"] = max_tokens 
                    logger.warning("max_tokens not found in api_params, setting max_completion_tokens directly")

                api_params["response_format"] = {"type": "text"}
                api_params["reasoning_effort"] = "medium" # Reverted from high
                api_params["store"] = False
                logger.info("Adding o3-mini specific parameters: response_format, reasoning_effort, store")
            
            # Add standard parameters like temperature if needed for either model
            # api_params["temperature"] = 0.7 

            response = self.client.chat.completions.create(**api_params)
            
            logger.info(f"Received response from model: {response.model}") # Log the model that responded
            return response
        except Exception as e:
            logger.error(f"Error calling OpenAI API: {str(e)}")
            if "authentication" in str(e).lower():
                logger.warning("Authentication error with OpenAI API, using mock response")
                # Create a mock response object with the same structure
                from collections import namedtuple
                
                Choice = namedtuple('Choice', ['message'])
                Message = namedtuple('Message', ['content'])
                Usage = namedtuple('Usage', ['prompt_tokens', 'completion_tokens', 'total_tokens'])
                
                mock_message = Message(content="This is a mock response due to authentication error.")
                mock_choice = Choice(message=mock_message)
                mock_usage = Usage(prompt_tokens=100, completion_tokens=50, total_tokens=150)
                
                Response = namedtuple('Response', ['choices', 'usage'])
                return Response(choices=[mock_choice], usage=mock_usage)
            else:
                raise

    def generate(self, transcript: str, title: Optional[str] = None, description: Optional[str] = None, chapters: Optional[List[Dict[str, Any]]] = None, format_type: SummaryFormat = SummaryFormat.STANDARD) -> Dict[str, Any]:
        """Generate summary from transcript text using provided context."""
        try:
            logger.info(f"Starting summary generation with format: {format_type}")
            logger.info(f"Context provided - Title: {bool(title)}, Description: {bool(description)}, Chapters: {bool(chapters)}")
            
            # Input validation
            if not transcript or not transcript.strip():
                raise ValueError("Transcript is empty or invalid")
            
            # Check if we're using a mock API key
            if not settings.OPENAI_API_KEY:
                logger.warning("Using mock OpenAI response because API key is not set")
                # Return a mock response
                return {
                    "summary": f"This is a mock {format_type} summary because the OpenAI API key is not set. In a real environment, this would be a summary of the video content.",
                    "usage": {
                        "prompt_tokens": 100,
                        "completion_tokens": 50,
                        "total_tokens": 150,
                        "estimated_cost_usd": 0.0,
                        "timestamp": datetime.utcnow().isoformat()
                    }
                }
            
            # Check if this is a placeholder transcript
            if transcript.startswith("[") and (
                "No transcript available" in transcript or 
                "Failed to extract transcript" in transcript or
                "Error extracting transcript" in transcript
            ):
                logger.warning(f"Using placeholder summary for placeholder transcript: {transcript[:100]}...")
                return {
                    "summary": "Unable to generate a summary for this video due to transcript unavailability. The video may not have captions, or there might have been an error retrieving them.",
                    "usage": {
                        "prompt_tokens": 0,
                        "completion_tokens": 0,
                        "total_tokens": 0,
                        "estimated_cost_usd": 0.0,
                        "timestamp": datetime.utcnow().isoformat()
                    }
                }
                
            # Truncate text to avoid token limits while preserving context
            truncated_text = transcript[:15000]  # Approximately 3750 tokens
            logger.info(f"Transcript length: {len(transcript)}, truncated length: {len(truncated_text)}")
            
            # Get the base prompt (MASTER_DIGEST_PROMPT)
            base_prompt = self.get_prompt_for_format(format_type)
            
            # Format the chapters list for the prompt
            if chapters:
                chapters_formatted_list = "\n".join([f"- {chap.get('timestamp', 'N/A')}: {chap.get('title', 'Untitled')}" for chap in chapters])
            else:
                chapters_formatted_list = "None"
                
            # Prepare context dictionary for formatting
            context = {
                "title": title or "[Title not provided]",
                "description": description or "[Description not provided]",
                "chapters_formatted_list": chapters_formatted_list,
                "transcript": "[Transcript provided in user message]" # Placeholder as transcript goes in user message
            }
            
            # Format the base prompt with the actual context
            # We only format the context part, assuming the transcript itself goes in the user message below
            try:
                developer_prompt = base_prompt.format(**context)
            except KeyError as e:
                logger.error(f"Failed to format prompt. Missing key: {e}. Prompt: {base_prompt}", exc_info=True)
                # Fallback to a very simple prompt if formatting fails
                developer_prompt = "Summarize the transcript provided in the user message."

            logger.debug(f"Final Developer Prompt: \n{developer_prompt}") # Log the formatted prompt
            
            # Prepare messages - o3 models use developer message instead of system message
            messages = [
                {"role": "developer", "content": developer_prompt},
                {"role": "user", "content": truncated_text}
            ]
            
            # Make API call with retry logic and rate limiting
            with self.rate_limiter:  # Apply rate limiting
                response = self._call_openai_api(messages)
            
            if not response.choices:
                raise SummaryGenerationError("No summary generated in response")
            
            # Calculate cost
            cost = self.calculate_cost(
                response.usage.prompt_tokens,
                response.usage.completion_tokens
            )
            
            result = {
                "summary": response.choices[0].message.content,
                "usage": {
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                    "total_tokens": response.usage.total_tokens,
                    "estimated_cost_usd": cost,
                    "timestamp": datetime.utcnow().isoformat(),
                    "model": response.model  # Add the model name here
                }
            }
            
            logger.info(f"Summary generated successfully. Length: {len(result['summary'])}, Cost: ${cost:.4f}")
            return result
            
        except ValueError as e:
            logger.error(f"Validation error: {str(e)}")
            raise SummaryGenerationError(f"Invalid input: {str(e)}")
        except Exception as e:
            logger.error(f"Error generating summary: {str(e)}", exc_info=True)
            raise SummaryGenerationError(f"Failed to generate summary: {str(e)}")

    def get_prompt_for_format(self, format_type: SummaryFormat) -> str:
        """Return the prompt for the specified format."""
        # Ensure MASTER_DIGEST_PROMPT is accessible here if defined in base class
        # This assumes SummarizerInterface has MASTER_DIGEST_PROMPT as a class attribute
        return self.MASTER_DIGEST_PROMPT
