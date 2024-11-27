-- Create function for podcast search if it doesn't exist
CREATE OR REPLACE FUNCTION podcast_search_document(
    p_title TEXT,
    p_description TEXT,
    p_publisher TEXT,
    p_categories JSONB
) RETURNS TEXT AS $$
BEGIN
    RETURN COALESCE(p_title, '')
        || ' ' || COALESCE(p_description, '')
        || ' ' || COALESCE(p_publisher, '')
        || ' ' || COALESCE(
            (
                SELECT string_agg(value::text, ' ')
                FROM jsonb_array_elements(p_categories)
            ),
            ''
        );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create update_match_status function if it doesn't exist
CREATE OR REPLACE FUNCTION update_match_status(
  p_match_id UUID,
  p_status match_status
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the match status
  UPDATE matches 
  SET 
    status = p_status,
    updated_at = NOW()
  WHERE id = p_match_id;

  -- Create an activity record for the status change
  INSERT INTO activities (
    id,
    author_id,
    type,
    title,
    description,
    metadata
  )
  SELECT
    uuid_generate_v4(),
    m.author_id,
    'match'::activity_type,
    CASE p_status
      WHEN 'viewed' THEN 'Match viewed'
      WHEN 'contacted' THEN 'Podcast contacted'
      WHEN 'declined' THEN 'Match declined'
      ELSE 'Match status updated'
    END,
    CASE p_status
      WHEN 'viewed' THEN 'You viewed the match with ' || p.title
      WHEN 'contacted' THEN 'You contacted ' || p.title
      WHEN 'declined' THEN 'You declined the match with ' || p.title
      ELSE 'Match status updated for ' || p.title
    END,
    jsonb_build_object(
      'match_id', p_match_id,
      'old_status', m.status,
      'new_status', p_status,
      'podcast_id', m.podcast_id
    )
  FROM matches m
  JOIN podcasts p ON p.id = m.podcast_id
  WHERE m.id = p_match_id;
END;
$$;

-- Create triggers if they don't exist
DROP TRIGGER IF EXISTS update_matches_updated_at ON matches;
CREATE TRIGGER update_matches_updated_at
    BEFORE UPDATE ON matches
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_interviews_updated_at ON interviews;
CREATE TRIGGER update_interviews_updated_at
    BEFORE UPDATE ON interviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_matches_author_id ON matches(author_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_interviews_author_id ON interviews(author_id);
CREATE INDEX IF NOT EXISTS idx_interviews_status ON interviews(status);
CREATE INDEX IF NOT EXISTS idx_activities_author_id ON activities(author_id);
CREATE INDEX IF NOT EXISTS idx_notifications_author_id ON notifications(author_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);