-- Enable UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum for contact methods
CREATE TYPE contact_method AS ENUM (
  'email',
  'social',
  'form',
  'referral',
  'other'
);

-- Enum for contact status
CREATE TYPE contact_status AS ENUM (
  'sent',
  'received',
  'noResponse',
  'scheduled',
  'declined'
);

-- Table for tracking all contact attempts
CREATE TABLE contact_history (
  -- Primary identifiers
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES saved_matches(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Contact details
  method contact_method NOT NULL,
  status contact_status NOT NULL DEFAULT 'sent',
  content TEXT NOT NULL,
  
  -- Method-specific details stored as JSONB
  email_details JSONB,
  social_details JSONB,
  
  -- Follow-up tracking
  requires_follow_up BOOLEAN DEFAULT false,
  follow_up_date TIMESTAMP WITH TIME ZONE,
  follow_up_note TEXT,
  
  -- Response tracking
  response_received TEXT,
  response_date TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT valid_email_details CHECK (
    method != 'email' OR (
      email_details IS NOT NULL AND
      email_details ? 'emailAddress'
    )
  ),
  CONSTRAINT valid_social_details CHECK (
    method != 'social' OR (
      social_details IS NOT NULL AND
      social_details ? 'platform'
    )
  )
);

-- Indexes for common queries
CREATE INDEX idx_contact_history_match ON contact_history(match_id);
CREATE INDEX idx_contact_history_author ON contact_history(author_id);
CREATE INDEX idx_contact_history_status ON contact_history(status);
CREATE INDEX idx_contact_history_follow_up ON contact_history(requires_follow_up, follow_up_date)
  WHERE requires_follow_up = true;

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_contact_history_timestamp
  BEFORE UPDATE ON contact_history
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 