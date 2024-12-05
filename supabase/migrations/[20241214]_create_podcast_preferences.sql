-- Enable UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create podcast_preferences table
CREATE TABLE podcast_preferences (
  -- Primary identifiers
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Example shows and preferences
  example_shows TEXT[], -- Array of podcast names they'd like to be on
  interview_topics TEXT[], -- Key points/topics they want to discuss
  target_audiences TEXT[], -- Types of audiences they want to reach
  
  -- Additional preferences
  preferred_episode_length TEXT, -- e.g., '30-60 minutes', 'under 30 minutes'
  preferred_formats TEXT[], -- e.g., ['interview', 'panel discussion', 'solo host']
  content_restrictions TEXT, -- Any content they want to avoid
  additional_notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT unique_author_preferences UNIQUE (author_id)
);

-- Add RLS policies
ALTER TABLE podcast_preferences ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own preferences" 
  ON podcast_preferences 
  FOR SELECT 
  USING (auth.uid() = author_id);

CREATE POLICY "Users can create own preferences" 
  ON podcast_preferences 
  FOR INSERT 
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own preferences" 
  ON podcast_preferences 
  FOR UPDATE 
  USING (auth.uid() = author_id);

-- Update trigger for updated_at
CREATE TRIGGER update_podcast_preferences_updated_at
  BEFORE UPDATE ON podcast_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE podcast_preferences IS 'Stores author preferences for podcast matching';
COMMENT ON COLUMN podcast_preferences.example_shows IS 'List of podcasts the author would like to appear on';
COMMENT ON COLUMN podcast_preferences.interview_topics IS 'Topics/points the author wants to discuss in interviews';
COMMENT ON COLUMN podcast_preferences.target_audiences IS 'Types of audiences the author wants to reach';
COMMENT ON COLUMN podcast_preferences.preferred_episode_length IS 'Preferred podcast episode duration';
COMMENT ON COLUMN podcast_preferences.preferred_formats IS 'Types of podcast formats the author prefers';
COMMENT ON COLUMN podcast_preferences.content_restrictions IS 'Content or topics the author wants to avoid';