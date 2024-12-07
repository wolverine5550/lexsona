-- First, disable row level security to avoid locks
ALTER TABLE IF EXISTS activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS search_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS podcast_collections DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS podcast_tags DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS podcast_notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS email_drafts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS message_templates DISABLE ROW LEVEL SECURITY;

-- Drop dependent tables first (junction tables and tables with foreign keys)
DROP TABLE IF EXISTS collection_items CASCADE;
DROP TABLE IF EXISTS match_tags CASCADE;
DROP TABLE IF EXISTS email_attachments CASCADE;
DROP TABLE IF EXISTS template_placeholders CASCADE;
DROP TABLE IF EXISTS ticket_messages CASCADE;
DROP TABLE IF EXISTS ticket_attachments CASCADE;

-- Drop tables that have been consolidated into user_activities
DROP TABLE IF EXISTS activities CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS search_history CASCADE;

-- Drop tables that have been consolidated into user_collections
DROP TABLE IF EXISTS podcast_collections CASCADE;
DROP TABLE IF EXISTS podcast_tags CASCADE;
DROP TABLE IF EXISTS podcast_notes CASCADE;

-- Drop tables that have been consolidated into messages
DROP TABLE IF EXISTS email_drafts CASCADE;
DROP TABLE IF EXISTS message_templates CASCADE;
DROP TABLE IF EXISTS template_categories CASCADE;

-- Drop redundant analysis tables
DROP TABLE IF EXISTS analysis_cache CASCADE;
DROP TABLE IF EXISTS analysis_metrics CASCADE;
DROP TABLE IF EXISTS episode_analysis CASCADE;
DROP TABLE IF EXISTS prompt_metrics CASCADE;
DROP TABLE IF EXISTS prompt_templates CASCADE;

-- Drop support system tables (can be moved to a separate service later)
DROP TABLE IF EXISTS support_tickets CASCADE;
DROP TABLE IF EXISTS staff_members CASCADE;
DROP TABLE IF EXISTS staff_roles CASCADE;

-- Drop redundant matches tables (keeping only the main matches table)
DROP TABLE IF EXISTS podcast_matches CASCADE;
DROP TABLE IF EXISTS saved_matches CASCADE;
DROP TABLE IF EXISTS saved_podcasts CASCADE;

-- Add a saved boolean to matches table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'matches' 
                  AND column_name = 'is_saved') THEN
        ALTER TABLE matches ADD COLUMN is_saved BOOLEAN DEFAULT false;
    END IF;
END $$; 