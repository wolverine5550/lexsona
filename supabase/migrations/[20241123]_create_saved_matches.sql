-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum for match status
CREATE TYPE match_status AS ENUM (
  'viewed',
  'contacted',
  'pending',
  'scheduled',
  'completed',
  'rejected'
);

-- Enum for rejection reasons
CREATE TYPE rejection_reason AS ENUM (
  'not_relevant',
  'audience_mismatch',
  'no_response',
  'declined',
  'scheduling_conflict',
  'other'
);

-- Main table for saved matches
CREATE TABLE saved_matches (
  -- Primary identifiers
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID NOT NULL REFERENCES auth.users(id),
  podcast_id TEXT NOT NULL,
  
  -- Match details
  match_score DECIMAL(3,2) NOT NULL CHECK (match_score >= 0 AND match_score <= 1),
  match_reasons TEXT[] NOT NULL,
  
  -- Status tracking
  status match_status NOT NULL DEFAULT 'viewed',
  rejection_reason rejection_reason,
  
  -- Author engagement
  is_bookmarked BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_viewed_at TIMESTAMP WITH TIME ZONE,
  contacted_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  CONSTRAINT unique_author_podcast UNIQUE (author_id, podcast_id),
  CONSTRAINT valid_rejection_reason CHECK (
    (status = 'rejected' AND rejection_reason IS NOT NULL) OR
    (status != 'rejected' AND rejection_reason IS NULL)
  )
);

-- Indexes for common queries
CREATE INDEX idx_saved_matches_author ON saved_matches(author_id);
CREATE INDEX idx_saved_matches_status ON saved_matches(author_id, status);
CREATE INDEX idx_saved_matches_bookmarked ON saved_matches(author_id, is_bookmarked);
CREATE INDEX idx_saved_matches_score ON saved_matches(author_id, match_score DESC);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_saved_matches_timestamp
  BEFORE UPDATE ON saved_matches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 