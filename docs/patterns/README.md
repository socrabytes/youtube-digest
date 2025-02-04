# Development Patterns and Best Practices

This document outlines the key development patterns and best practices established during the development of YouTube Digest.

## Architecture Patterns

### Service-Oriented Architecture
- Services are isolated in `backend/app/services/`
- Each service has a single responsibility
- Example: `OpenAISummarizer` handles only summarization logic
- Services communicate through well-defined interfaces

### Background Processing
- Long-running tasks are handled asynchronously
- Status tracking through database states
- Example: Video processing pipeline in `backend/app/services/video_processor.py`

### Error Handling
- Hierarchical error structure
- Custom exceptions for different domains
- Consistent error response format
- Example: `SummaryGenerationError`, `TranscriptExtractionError`

## Database Patterns

### Schema Management
- All changes through Alembic migrations
- Migrations are reversible
- Each migration focuses on one change
- Example: `backend/alembic/versions/03b3983b0790_add_token_usage_tracking_and_summary_.py`

### Data Models
- Use SQLAlchemy ORM
- Enums for status fields
- JSON fields for complex data
- Explicit type conversions
- Example: `Video` model with `processing_status` enum

## API Design

### RESTful Endpoints
- Resource-based naming
- Standard HTTP methods
- Consistent response format
- Example: `/api/v1/videos/{video_id}/summary`

### Error Responses
```json
{
    "error": {
        "code": "SUMMARY_GENERATION_ERROR",
        "message": "Failed to generate summary",
        "details": {...}
    }
}
```

## Testing Patterns

### Unit Tests
- One test file per service/component
- Mock external dependencies
- Test happy and error paths
- Example: `test_openai_summarizer.py`

### Integration Tests
- Test end-to-end flows
- Use test database
- Reset state between tests

## Frontend Patterns

### State Management
- React hooks for local state
- Loading states for async operations
- Error handling and display
- Example: VideoCard component

### API Integration
- Centralized API client
- Retry logic for failed requests
- Polling for long-running operations

## Documentation Patterns

### Code Documentation
- Docstrings for all public functions
- Type hints for parameters
- Example usage in comments

### API Documentation
- OpenAPI/Swagger specs
- Example requests/responses
- Error scenarios documented

## Feature Implementation Workflow

1. Requirements Gathering
   - User story definition
   - Acceptance criteria
   - Technical requirements

2. Implementation Steps
   - Service layer implementation
   - Database schema updates
   - API endpoint creation
   - Frontend integration
   - Testing
   - Documentation

3. Quality Checks
   - Unit tests passing
   - Integration tests passing
   - Code review guidelines
   - Documentation updated

## Example: OpenAI Summary Generation

### Implementation Details
```markdown
1. Core Service
   - Rate limiting with tenacity
   - Retry logic for API failures
   - Token usage tracking
   - Cost calculation

2. Database Changes
   - Added token_usage JSON field
   - Removed summary_style (simplified)
   - Migration scripts

3. API Integration
   - New summary endpoint
   - Background task status endpoint
   - Error handling middleware

4. Frontend Updates
   - Summary display component
   - Loading states
   - Error handling
```

## Lessons Learned

1. Start with clear service boundaries
2. Use background tasks for long operations
3. Implement comprehensive error handling
4. Track resource usage (API calls, tokens)
5. Document patterns as they emerge
