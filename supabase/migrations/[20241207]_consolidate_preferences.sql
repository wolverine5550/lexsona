-- First, add any missing columns from user_preferences to podcast_preferences
ALTER TABLE podcast_preferences
ADD COLUMN IF NOT EXISTS style_preferences JSONB DEFAULT '{
    "isInterviewPreferred": false,
    "isStorytellingPreferred": false,
    "isEducationalPreferred": false,
    "isDebatePreferred": false
}';

-- Migrate data from user_preferences to podcast_preferences
INSERT INTO podcast_preferences (
    author_id,
    style_preferences,
    created_at,
    updated_at
)
SELECT 
    user_id,
    style_preferences,
    created_at,
    updated_at
FROM user_preferences
ON CONFLICT (author_id) 
DO UPDATE SET
    style_preferences = EXCLUDED.style_preferences,
    updated_at = EXCLUDED.updated_at;

-- Drop the user_preferences table
DROP TABLE IF EXISTS user_preferences CASCADE; 