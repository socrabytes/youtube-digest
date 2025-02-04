# OpenAI Integration Pattern

## Overview
Pattern for reliable OpenAI API integration with rate limiting, cost tracking, and error handling.

## When to Use
- Integrating any OpenAI API service
- Need for rate-limited API calls
- Usage and cost tracking required

## Pattern Components

### 1. Rate Limiting
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

### 2. Error Handling
```python
@retry(
    wait=wait_exponential(multiplier=1, min=4, max=10),
    stop=stop_after_attempt(3),
    retry=retry_if_exception_type(APIError)
)
def api_call():
    # API call implementation
    pass
```

### 3. Cost Tracking
```python
TOKEN_COST_PER_1K = {
    "prompt": 0.01,    # Input tokens
    "completion": 0.03 # Output tokens
}

def track_usage(response):
    return {
        "tokens": response.usage.total_tokens,
        "cost": calculate_cost(response.usage)
    }
```

## Example Implementation
See `backend/app/services/summarizers/openai_summarizer.py`

## Related Patterns
- [background-tasks.md](./background-tasks.md) - For handling long-running API operations
