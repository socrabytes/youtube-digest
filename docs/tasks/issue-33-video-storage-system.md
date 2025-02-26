# 📼 Create Video Storage System #33

## Status: [In Progress]

## Overview
This document summarizes the refactoring of the YouTube Video Digester application's database schema from a single, non-normalized `videos` table to a normalized relational schema (3NF). This change improves data integrity, reduces redundancy, and enhances the application's scalability and maintainability.

## Original User Story (Context)

> As a user,
> I want my video metadata and summaries persistently stored
> So that I can access my video library and summaries at any time.

## Key Accomplishments
*   **Normalized Schema:** Implemented a 3NF relational schema with separate tables for `channels`, `videos`, `categories`, `transcripts`, `digests`, `users`, `llms`, `processing_logs`, `user_digests`, and `digest_interactions`.  This eliminates data redundancy and improves data consistency.
*   **`yt-dlp` Data Integration:** Successfully integrated data fetched from the `yt-dlp` library into the new schema. This involved thorough analysis of `yt-dlp`'s output and careful mapping of data fields to appropriate database columns and types.
*   **SQLAlchemy Models:** Defined and implemented comprehensive SQLAlchemy models representing the new database entities and their relationships.
*   **Database Migration:** Successfully migrated the database to the new schema using Alembic.  Due to the development stage and disposable nature of existing data, this involved dropping the existing table and recreating the schema from scratch.
* **Docker compose:** Database schema changes were applied by stopping, force recreating and rebuilding the docker containers
*   **Enhanced Data Model:** Added fields to support:
    *   Multiple digest types (highlights, chapters, detailed) and LLM providers (`DIGESTS` table).
    *   Tracking of transcript source, processing status, and fetch/processing timestamps (`TRANSCRIPTS` table).
    *   User interaction tracking (saves, views, skips) (`USER_DIGESTS`, `DIGEST_INTERACTIONS` tables).


## Key Decisions and Rationale

*   **Normalization (3NF):**  Chosen to ensure data integrity, reduce anomalies, and provide a solid foundation for future development.
*   **Data Type Selection:** PostgreSQL data types were carefully selected based on `yt-dlp` data analysis and database best practices (e.g., `TEXT` for potentially long transcripts, `TIMESTAMP WITHOUT TIME ZONE` for consistent timestamp handling). [Link to data type mapping table - if it exists as a separate document. If it's small, consider embedding it directly in this section.]
*   **Relationship Definitions:**  One-to-many, many-to-many, and one-to-one relationships were defined using SQLAlchemy's `relationship` and `ForeignKey` constructs to accurately represent the connections between entities (e.g., a `Channel` has many `Videos`, a `Video` has one `Transcript`).
* **Dropping and recreating database:** Given the phase of the application, dropping the tables and recreating was chosen instead of writing complex migration code.

## Challenges and Solutions

*   **Understanding `yt-dlp` Output:**  Initial uncertainty about the structure of `yt-dlp`'s returned data was resolved by creating a dedicated script to explore and document the output for various video types.
*   **Database Design Principles:**  Addressed initial lack of database design experience by researching normalization principles (specifically 3NF) and studying examples of relational database schemas.
*   **SQLAlchemy Relationship Mapping:**  Successfully mapped complex relationships between entities using SQLAlchemy's declarative model system, ensuring correct data retrieval and integrity.

## Lessons Learned

*   **Data Source Analysis is Paramount:**  Thorough analysis of external data sources (like `yt-dlp`) is crucial *before* designing a database schema.
*   **Normalization Benefits:**  A normalized schema, while initially more complex to implement, provides significant long-term benefits in terms of data integrity and maintainability.
*   **SQLAlchemy's Capabilities:**  SQLAlchemy offers a powerful and flexible way to interact with databases in Python, but requires a solid understanding of its core concepts.
* **Database Schema Migration is critical when building applications:** There will be changes, having a solid understanding of these migrations, will save time, and ensure data integrity

## Open Questions / Future Considerations

- **Caching (Redis/Memcached):**  
Implementing caching was part of the original user story but was postponed. This should be addressed in a future task to further reduce API calls and improve performance.
- **Full-Text Search:**  
Consider adding full-text search capabilities to the TRANSCRIPTS table for improved searchability, which could enhance user experience.
- **Advanced Analytics:**  
Leverage fields like `generated_at`, `fetched_at`, and `processed_at` for time-based analytics. This can help quantify the "time saved" metric by tracking user engagement and interactions with various digest types.
- **Integration of Multiple Digest Variants and LLM Providers:**  
As new digest types and additional LLM providers are integrated, adjustments to the DIGESTS table and related API endpoints may be required to support nuanced output and user choice.

## Related Documentation
- [yt-dlp output analysis](/backend/scripts/analyze_ytdlp_output.py)
- [yt-dlp Mapping](/docs/features/database/ytdlp_mapping.md)
- [Schema Design](/docs/features/database/schema.md)
# Current Status
All database-related tasks are complete. The schema is now properly normalized with:
- Separate tables for different entities
- Proper relationships and constraints
- Enhanced error tracking and metadata
- Improved performance considerations (indexes)

## Next Steps
1. Backend API Refactoring 
   - Update FastAPI endpoints to use new models
   - Create/update Pydantic schemas
   - Implement CRUD operations
   - Add validation using new constraints
   - Update error handling

2. Frontend Updates 
   - Adapt to new API structure
   - Update data fetching
   - Modify UI components
   - Add new features enabled by schema