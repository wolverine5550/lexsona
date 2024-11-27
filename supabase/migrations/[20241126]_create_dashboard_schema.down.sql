-- First drop all objects that depend on the types and functions
DROP VIEW IF EXISTS author_stats;

-- Drop tables with dependencies
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS activities;
DROP TABLE IF EXISTS interviews;
DROP TABLE IF EXISTS matches;
DROP TABLE IF EXISTS podcasts CASCADE;
DROP TABLE IF EXISTS authors;

-- Drop triggers
DROP TRIGGER IF EXISTS update_authors_updated_at ON authors;
DROP TRIGGER IF EXISTS update_matches_updated_at ON matches;
DROP TRIGGER IF EXISTS update_interviews_updated_at ON interviews;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS update_match_status(UUID, match_status);
DROP FUNCTION IF EXISTS podcast_search_document(TEXT, TEXT, TEXT, JSONB);

-- Drop indexes (if they weren't already dropped with the tables)
DROP INDEX IF EXISTS idx_matches_author_id;
DROP INDEX IF EXISTS idx_matches_status;
DROP INDEX IF EXISTS idx_interviews_author_id;
DROP INDEX IF EXISTS idx_interviews_status;
DROP INDEX IF EXISTS idx_activities_author_id;
DROP INDEX IF EXISTS idx_notifications_author_id;
DROP INDEX IF EXISTS idx_notifications_read;

-- Finally drop the types
DROP TYPE IF EXISTS match_status CASCADE;
DROP TYPE IF EXISTS interview_status CASCADE;
DROP TYPE IF EXISTS activity_type CASCADE;
DROP TYPE IF EXISTS notification_priority CASCADE; 