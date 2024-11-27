-- Enable UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum for note categories
CREATE TYPE note_category AS ENUM (
  'preparation',
  'outreach',
  'feedback',
  'followUp',
  'general'
);

-- Table for storing detailed notes and feedback
CREATE TABLE podcast_notes (
  -- Primary identifiers
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES saved_matches(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Note content
  category note_category NOT NULL,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  
  -- Optional feedback data stored as JSONB for flexibility
  feedback JSONB,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Indexes and constraints
  CONSTRAINT valid_feedback_format CHECK (
    feedback IS NULL OR (
      feedback ? 'isRelevant' AND
      feedback ? 'audienceMatch' AND
      feedback ? 'topicMatch'
    )
  )
);

-- Indexes for common queries
CREATE INDEX idx_podcast_notes_match ON podcast_notes(match_id);
CREATE INDEX idx_podcast_notes_author ON podcast_notes(author_id);
CREATE INDEX idx_podcast_notes_category ON podcast_notes(category);
CREATE INDEX idx_podcast_notes_pinned ON podcast_notes(is_pinned) WHERE is_pinned = true;

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_podcast_notes_timestamp
  BEFORE UPDATE ON podcast_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 