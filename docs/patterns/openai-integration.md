# OpenAI Integration Pattern

## Overview
Pattern for reliable OpenAI API integration, supporting multiple models with appropriate rate limiting, cost tracking, and error handling.

## When to Use
- Integrating any OpenAI API service (e.g., Chat Completions)
- Need for rate-limited API calls
- Requirement to support and differentiate between multiple OpenAI models (e.g., `gpt-4o`, `o3-mini`)
- Usage and cost tracking required, potentially varying by model

## Pattern Components

### 1. Rate Limiting
(Using a sliding window approach)
```python
class RateLimiter:
    def __init__(self, calls_per_minute: int):
        self.calls_per_minute = calls_per_minute
        self.window_size = 60
        self.min_interval = self.window_size / self.calls_per_minute
        self.calls = []
        self.lock = Lock()

    def __enter__(self):
        with self.lock:
            now = time.time()
            # Remove old calls
            self.calls = [t for t in self.calls if now - t < self.window_size]
            
            if self.calls and now - self.calls[-1] < self.min_interval:
                time.sleep(self.min_interval)
            
            self.calls.append(time.time())
```

### 2. Error Handling & Retries
(Using `tenacity` for robust retries)
```python
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from openai import APIError, RateLimitError, BadRequestError # Add relevant error types

@retry(
    wait=wait_exponential(multiplier=1, min=4, max=10),
    stop=stop_after_attempt(3),
    # Retry on common transient errors, including rate limits
    retry=retry_if_exception_type((APIError, RateLimitError))
)
def api_call(**params):
    # API call implementation using params
    # Catch BadRequestError specifically, as it might indicate
    # parameter issues specific to the model, which shouldn't be retried.
    try:
        response = client.chat.completions.create(**params)
        return response
    except BadRequestError as e:
        logger.error(f"BadRequestError calling OpenAI API (likely model parameter issue): {e}")
        raise # Re-raise to prevent retry on bad parameters
    except Exception as e:
        logger.error(f"Unhandled exception during API call: {e}")
        raise # Re-raise other unexpected errors
```

### 3. Handling Multiple Models & Parameters
Different models might require different parameters even for the same API endpoint (e.g., `chat.completions.create`). Use conditional logic to set parameters based on the selected model.

```python
def call_openai_api(model_name: str, messages: list, max_tokens_default: int = 3000):
    api_params = {
        "model": model_name,
        "messages": messages,
        # Set a default parameter name, may be overridden
        "max_tokens": max_tokens_default 
    }

    if model_name == "o3-mini":
        # o3-mini requires different parameters
        if "max_tokens" in api_params:
            max_val = api_params.pop("max_tokens")
            api_params["max_completion_tokens"] = max_val
        
        api_params["response_format"] = {"type": "text"}
        api_params["reasoning_effort"] = "medium" # or "high" / "low"
        api_params["store"] = False
        # Add other o3-mini specific params...
    
    elif model_name == "gpt-4o":
        # gpt-4o might use max_tokens directly
        # Add any gpt-4o specific params...
        pass # Example: max_tokens is likely correct already

    # Ensure max_tokens/max_completion_tokens doesn't exceed model limits (check OpenAI docs)

    return api_call(**api_params) # Use the retry wrapper
```

### 4. Model-Specific Cost Tracking
Costs vary per model. Store costs and calculate based on the model used and token counts from the response.

```python
# Example cost structure (Store in config or fetch dynamically)
MODEL_COSTS_PER_1K_TOKENS = {
    "o3-mini": {"prompt": 0.0005, "completion": 0.0015}, 
    "gpt-4o": {"prompt": 0.005, "completion": 0.015},
    # Add other models as needed
}

def calculate_cost(model_name: str, prompt_tokens: int, completion_tokens: int) -> float:
    costs = MODEL_COSTS_PER_1K_TOKENS.get(model_name)
    if not costs:
        logger.warning(f"Cost data not found for model: {model_name}. Returning 0.")
        return 0.0
    
    prompt_cost = (prompt_tokens / 1000) * costs["prompt"]
    completion_cost = (completion_tokens / 1000) * costs["completion"]
    return prompt_cost + completion_cost

def track_usage(response):
    model_used = response.model # Get the specific model version used
    # Handle potential variations like 'o3-mini-2025-01-31'
    base_model = model_used.split('-')[0] # Basic way to get base model
    # A more robust mapping might be needed depending on OpenAI response format
    
    prompt_tokens = response.usage.prompt_tokens
    completion_tokens = response.usage.completion_tokens
    total_tokens = response.usage.total_tokens
    
    cost = calculate_cost(base_model, prompt_tokens, completion_tokens)
    
    return {
        "model_used": model_used,
        "prompt_tokens": prompt_tokens,
        "completion_tokens": completion_tokens,
        "total_tokens": total_tokens,
        "cost": cost
    }
```

## Key Considerations

*   **API Endpoint:** For chat-based models like `gpt-4o` and `o3-mini`, the `client.chat.completions.create` endpoint is standard.
*   **Parameter Verification:** Always consult the official OpenAI documentation for the specific model you are using, as required parameters (`max_tokens` vs `max_completion_tokens`) and supported features (`reasoning_effort`) can vary significantly.
*   **Prompt Engineering:** Different models exhibit varying levels of sensitivity to prompt structure and context. Test and adapt prompts for optimal performance with each model.
*   **Context is Key:** Providing sufficient and relevant context (like titles, descriptions, chapters for summarization) within the prompt generally improves the quality of the generated output.

## Example Implementation
See `backend/app/services/summarizers/openai_summarizer.py` for a concrete example applying these patterns.

## Related Patterns
- [background-tasks.md](./background-tasks.md) - For handling potentially long-running API operations asynchronously.
