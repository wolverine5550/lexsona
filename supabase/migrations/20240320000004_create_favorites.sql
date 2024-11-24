-- Enable UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table for podcast collections
CREATE TABLE podcast_collections (
  -- Primary identifiers
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Collection details
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  color TEXT,
  icon TEXT,
  
  -- Metadata
  podcast_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT unique_author_collection_name UNIQUE (author_id, name)
);

-- Table for custom tags
CREATE TABLE podcast_tags (
  -- Primary identifiers
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Tag details
  name TEXT NOT NULL,
  color TEXT,
  
  -- Usage tracking
  use_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT unique_author_tag_name UNIQUE (author_id, name)
);

-- Junction table for collections and saved matches
CREATE TABLE collection_items (
  -- Composite primary key
  collection_id UUID REFERENCES podcast_collections(id) ON DELETE CASCADE,
  match_id UUID REFERENCES saved_matches(id) ON DELETE CASCADE,
  
  -- Item details
  added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  sort_order INT,
  
  PRIMARY KEY (collection_id, match_id)
);

-- Junction table for tags and saved matches
CREATE TABLE match_tags (
  -- Composite primary key
  tag_id UUID REFERENCES podcast_tags(id) ON DELETE CASCADE,
  match_id UUID REFERENCES saved_matches(id) ON DELETE CASCADE,
  
  added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  PRIMARY KEY (tag_id, match_id)
);

-- Indexes for common queries
CREATE INDEX idx_collections_author ON podcast_collections(author_id);
CREATE INDEX idx_tags_author ON podcast_tags(author_id);
CREATE INDEX idx_collection_items_match ON collection_items(match_id);
CREATE INDEX idx_match_tags_match ON match_tags(match_id);

-- Function to update collection podcast count
CREATE OR REPLACE FUNCTION update_collection_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE podcast_collections
    SET podcast_count = podcast_count + 1
    WHERE id = NEW.collection_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE podcast_collections
    SET podcast_count = podcast_count - 1
    WHERE id = OLD.collection_id;
  END IF;
  RETURN NULL;
END;
$$ language 'plpgsql';

-- Function to update tag use count
CREATE OR REPLACE FUNCTION update_tag_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE podcast_tags
    SET use_count = use_count + 1
    WHERE id = NEW.tag_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE podcast_tags
    SET use_count = use_count - 1
    WHERE id = OLD.tag_id;
  END IF;
  RETURN NULL;
END;
$$ language 'plpgsql';

-- Triggers for maintaining counts
CREATE TRIGGER update_collection_count_trigger
  AFTER INSERT OR DELETE ON collection_items
  FOR EACH ROW
  EXECUTE FUNCTION update_collection_count();

CREATE TRIGGER update_tag_count_trigger
  AFTER INSERT OR DELETE ON match_tags
  FOR EACH ROW
  EXECUTE FUNCTION update_tag_count();

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_collections_timestamp
  BEFORE UPDATE ON podcast_collections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 