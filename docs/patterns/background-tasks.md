# Background Task Pattern

## Overview
Pattern for handling long-running operations with status tracking.

## When to Use
- Long-running operations
- API-intensive tasks
- Resource-heavy processing

## Pattern Components

### 1. Status Tracking
```python
class ProcessingStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
```

### 2. Task Implementation
```python
def process_in_background(video_id: int):
    try:
        # Update initial status
        update_status(video_id, ProcessingStatus.PROCESSING)
        
        # Perform task
        result = perform_task(video_id)
        
        # Update success
        update_status(video_id, ProcessingStatus.COMPLETED)
        save_result(video_id, result)
        
    except Exception as e:
        # Handle failure
        update_status(video_id, ProcessingStatus.FAILED)
        log_error(video_id, str(e))
```

### 3. Status Checking
```python
@router.get("/{id}/status")
def check_status(id: int):
    return {
        "status": get_current_status(id),
        "progress": get_progress(id)
    }
```

## Example Implementation
See `backend/app/services/video_processor.py`

## Related Patterns
- [openai-integration.md](./openai-integration.md) - For API operations that need background processing
