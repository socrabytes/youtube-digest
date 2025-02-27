# Issue #45: Backend API Refactoring

*Sub-issue from #33*

## User Story
As a developer, I need to refactor the backend API to align with the normalized database schema so that the application can properly handle the relationships between entities and provide a more maintainable codebase.

## Description
This task involves updating the FastAPI backend to use the new normalized database models, creating appropriate Pydantic schemas, implementing CRUD operations, adding validation, and improving error handling.

## Acceptance Criteria

### Create New API Endpoints:
- [x] Separate routers for each entity:
  - [x] `/api/v1/videos/` (update existing)
  - [x] `/api/v1/channels/` (new)
  - [x] `/api/v1/transcripts/` (new)
  - [x] `/api/v1/digests/` (new)
  - [x] `/api/v1/users/` (new)
  - [x] `/api/v1/categories/` (new)
  - [x] `/api/v1/llms/` (new)

### Update Pydantic Models:
- [x] Current VideoResponse model is outdated
- [x] Create new schemas for:
  - [x] Channel responses
  - [x] Transcript responses
  - [x] Digest responses
  - [x] User responses
  - [x] Processing logs

### Implement CRUD Operations:
- [x] Update existing video operations
- [x] Add channel operations
- [x] Add transcript operations
- [x] Add digest operations
- [x] Add user operations
- [x] Add category operations
- [x] Add LLM and processing log operations

### Add Validation:
- [x] Update URL validation for videos
- [x] Add email/username validation for users
- [x] Add digest type validation
- [x] Add processing status validation

### Update Error Handling:
- [x] Consistent error handling across all endpoints
- [x] Appropriate HTTP status codes
- [x] Detailed error messages

## Progress

### Completed
- Created new router modules: users, categories, llms
- Created central router that includes all sub-routers
- Refactored videos.py to work with the normalized schema
- Updated main.py to use the centralized router structure
- Fixed test suite to work with the new API response formats
- Implemented field mapping strategy for API compatibility without database migrations
- Updated test fixtures to use correct enum values and required fields
- Ensured all tests pass in the Docker test environment

### In Progress
- Adding missing endpoints
- Updating documentation

### To Do
- Add any missing validation
- Ensure proper error handling across all endpoints

## Notes
- The refactoring maintains backward compatibility with existing frontend code
- All endpoints follow RESTful API design principles
- Authentication and authorization will be addressed in a separate issue
- Field mapping strategy is used to maintain API compatibility:
  - Video model uses `webpage_url` in DB, but API returns it as `url`
  - Video model uses `thumbnail` in DB, but API returns it as `thumbnail_url`
  - Digest model uses `content` in DB, but API returns it as `digest`
