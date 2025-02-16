# yt-dlp to Database Field Mapping

This document maps the fields from yt-dlp to our database schema, ensuring accurate data types and constraints.

## Video Fields

| yt-dlp Field | PostgreSQL Type | SQLAlchemy Type | Constraints | Notes |
|--------------|-----------------|-----------------|-------------|--------|
| id/display_id | VARCHAR(16) | String(16) | NOT NULL, UNIQUE | Standard YouTube IDs are 11 chars, buffer for safety |
| title | VARCHAR(255) | String(255) | NOT NULL | YouTube allows up to ~100 chars, buffer for safety |
| description | TEXT | Text | NULL | Can exceed 5000 chars |
| duration | INTEGER | Integer | NOT NULL | Range observed: 19 to 12527 seconds (3.5 hours) |
| view_count | BIGINT | BigInteger | NULL | Can exceed 5.4B (e.g., most viewed videos) |
| like_count | INTEGER | Integer | NULL | Can exceed 30M for popular videos |
| categories | JSONB | JSONB | NULL | Array of YouTube category strings |
| tags | JSONB | JSONB | NULL | Array of tag strings |
| thumbnail | VARCHAR(255) | String(255) | NULL | URLs can vary in length |
| webpage_url | VARCHAR(100) | String(100) | NOT NULL | YouTube URLs have consistent format |
| upload_date | VARCHAR(8) | String(8) | NOT NULL | Format: YYYYMMDD |
| chapters | JSONB | JSONB | NULL | Array of chapter objects |

## Channel Fields

| yt-dlp Field | PostgreSQL Type | SQLAlchemy Type | Constraints | Notes |
|--------------|-----------------|-----------------|-------------|--------|
| channel_id | VARCHAR(32) | String(32) | NOT NULL, UNIQUE | Standard format: UC + 22 chars |
| channel | VARCHAR(100) | String(100) | NOT NULL | Channel names can be quite long |
| channel_url | VARCHAR(128) | String(128) | NOT NULL | Based on channel ID length |
| channel_follower_count | INTEGER | Integer | NULL | Can exceed 100M for top channels |
| channel_is_verified | BOOLEAN | Boolean | NULL | True/False |
| uploader | VARCHAR(100) | String(100) | NULL | Same as channel name |
| uploader_id | VARCHAR(100) | String(100) | NULL | @handle format, can be long |
| uploader_url | VARCHAR(128) | String(128) | NULL | Based on handle length |

## Category Fields

| yt-dlp Field | PostgreSQL Type | SQLAlchemy Type | Constraints | Notes |
|--------------|-----------------|-----------------|-------------|--------|
| categories[0] | VARCHAR(50) | String(50) | NOT NULL | Standard YouTube categories |

## Implementation Notes

1. **Field Length Rationale**
   - Video IDs: 16 chars (11 standard + buffer)
   - Channel IDs: 32 chars (24 standard UC + 22 chars + buffer)
   - Titles/Names: 100-255 chars (based on YouTube's limits)
   - URLs: 128-255 chars (based on ID lengths + domain)
   - Text fields: No arbitrary limits, use TEXT type

2. **Dynamic Fields**
   - `view_count`, `like_count`, and `channel_follower_count` are frequently updated
   - Use UPSERT operations for updates
   - Consider adding `last_updated` timestamp
   - View counts use BIGINT for future-proofing

3. **Text Fields**
   - All string fields should be stripped of whitespace
   - URLs should be validated before storage
   - Consider indexes on `id`, `channel_id`, and `uploader_id`
   - Description stored as TEXT without length limit

4. **JSON Fields**
   - `categories`, `tags`, and `chapters` stored as JSONB for efficient querying
   - Chapter structure: `{"start_time": float, "title": string, "end_time": float}`
   - Tags can contain Unicode characters

5. **Validation Rules**
   - YouTube IDs: Use regex pattern `^[a-zA-Z0-9_-]{11}$`
   - Channel IDs: Use regex pattern `^UC[a-zA-Z0-9_-]{22}$`
   - URLs: Validate against YouTube URL patterns
   - Numeric fields: Ensure non-negative
   - Upload date: Validate YYYYMMDD format

6. **Error Handling**
   - Handle missing optional fields gracefully
   - Log validation errors with specific codes
   - Consider retry logic for rate limits
   - Handle Unicode characters in titles and descriptions

7. **Sample Data Note**
   These mappings are based on both:
   - Analysis of sample videos (see `backend/scripts/analyze_ytdlp_output.py`)
   - YouTube's known limitations and common practices
   - Buffer space added for future-proofing
