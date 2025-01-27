# Changelog

## [Unreleased]

### Added
- GitHub Project automation workflows
  - Auto-move issues labeled as "bug" to Bugs column
  - Auto-move assigned issues to Todo column
  - Auto-move issues to In Progress when branch created
- Structured issue templates with project integration
  - Task template with component and priority labels
  - Bug report template with detailed reproduction steps
- Project board automation with defined columns:
  - Backlog: New issues
  - Todo: Approved and assigned
  - In Progress: Active development
  - Bugs: Issue tracking
  - Done: Completed work

### Changed
- Split issue management workflow into focused components:
  - `auto-todo-column.yml` for assignment handling
  - `auto-progress-column.yml` for branch creation
- Removed consolidated `issue-management.yml` workflow
- Optimized GitHub Actions workflows
- Improved issue template structure
- Enhanced project board organization

## [0.2.0] - 2024-12-13
### Added
- Containerized development environment
- OpenAI integration for summaries
- PostgreSQL database setup
- Video submission and thumbnail display
- Basic frontend with Next.js
- Video metadata extraction

### In Progress
- Video library view
- Summary display formatting
- Loading states
- Error handling
- Transcript extraction
- Video categorization

## [0.1.0] - 2024-12-12
### Added
- Initial project setup
- Basic backend API with video submission endpoint
- Frontend form for YouTube URL submission
- Video thumbnail display
- Git repository initialization

### Technical Debt
- Need unit tests for video processing service
- Need integration tests for API endpoints
- API documentation pending
- README needs setup instructions
