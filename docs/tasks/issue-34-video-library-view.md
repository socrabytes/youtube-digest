# Issue #34: Implement Video Library View

*Sub-issue from #33*

## Status: [In Progress]

## User Story
As a user,
I want a clean and organized view of my processed videos
So that I can easily browse, search, and access my video library.

## Description
This task involves implementing the main video library interface using Next.js, creating a responsive layout, and handling video metadata display and interactions with the newly refactored backend API.

## Technical Context
The backend API has been refactored (Issue #45) to work with a normalized database schema (Issue #33). The frontend needs to be updated to work with this new API structure, which includes:

- Separate endpoints for videos, channels, transcripts, and digests
- Field mapping strategy for API compatibility (e.g., `url` instead of `webpage_url`)
- Enhanced metadata and relationships between entities

## Acceptance Criteria

### Grid/List View Implementation
- [ ] Toggle between grid and list views
- [ ] Responsive layout (mobile-first approach)
- [ ] Proper spacing and alignment
- [ ] Smooth transitions between views

### Video Card Component
- [ ] Display all required metadata:
  - [ ] Thumbnail
  - [ ] Title
  - [ ] Channel name
  - [ ] Duration
  - [ ] Published date
  - [ ] View count
- [ ] Proper thumbnail handling and fallbacks
- [ ] Loading states implemented
- [ ] Error states handled
- [ ] Interactive elements (hover effects, focus states)

### User Interactions
- [ ] Click handling for video details
- [ ] Quick summary preview on hover
- [ ] Sort options (date, title, channel)
- [ ] Basic filters (by category, duration)
- [ ] Pagination or infinite scroll

### Performance & Testing
- [ ] Lazy loading for images and content
- [ ] Component tests for all new components
- [ ] Responsive design tested across devices
- [ ] Accessibility compliance (WCAG 2.1 AA)

## Progress Report

### Completed Improvements to Digests View (Prerequisite)
Before implementing the Video Library View, we have completed several improvements to the Digests page which will inform the design patterns and component structure for the Library View:

#### UI/UX Improvements
- Enhanced video card display:
  - Created a hero-style layout with thumbnail as background and gradient overlay
  - Improved visual hierarchy with proper spacing and alignment
  - Added consistent metadata formatting with clear labels
  - Fixed upload date display with robust date handling for various formats

- Sidebar Navigation:
  - Implemented pagination to handle overflow of many videos
  - Added thumbnails to video list items for better recognition
  - Improved channel and video selection UX
  - Added search functionality

- General UI Enhancements:
  - Updated color scheme to use indigo/purple for brand consistency
  - Redesigned welcome page with modern two-column layout
  - Added markdown rendering for digest content
  - Improved responsive design for all screen sizes

#### Code Structure and Patterns
- Component organization for video metadata display
- Pagination implementation pattern
- Date formatting utility functions
- Visual styling patterns (color scheme, spacing, typography)

### Next Steps for Video Library View
- Begin implementing the main grid/list views based on patterns established in the Digests page
- Create reusable VideoCard component that can be used in both views
- Implement sorting and filtering functionality
- Set up new route and layout for the library view

## Implementation Details

### Component Structure
```
components/
  ├── video/
  │   ├── VideoGrid.tsx
  │   ├── VideoList.tsx
  │   ├── VideoCard.tsx
  │   ├── VideoDetails.tsx
  │   ├── VideoFilters.tsx
  │   └── VideoSorter.tsx
  ├── ui/
  │   ├── Toggle.tsx
  │   ├── Pagination.tsx
  │   ├── LoadingState.tsx
  │   └── ErrorState.tsx
  └── layout/
      └── LibraryLayout.tsx
```

### API Integration
- Use React Query for data fetching and caching
- Implement proper error handling for API requests
- Create type-safe interfaces for all API responses

### State Management
- Use React Context for library view preferences
- Local component state for UI interactions
- React Query for server state

## Progress

### Completed
- Initial project setup

### In Progress
- Component structure planning
- API integration strategy

### To Do
- Implement VideoGrid and VideoList components
- Create VideoCard component with all required features
- Add sorting and filtering functionality
- Implement pagination/infinite scroll
- Add tests for all components
- Ensure responsive design and accessibility

## Notes
- The design should follow the existing application style guide
- Performance is a key consideration, especially for large video libraries
- The implementation should leverage the relationships in the normalized database schema
