-- First, drop views that depend on authors
DROP VIEW IF EXISTS author_stats CASCADE;

-- Drop foreign key constraints from dependent tables
ALTER TABLE interviews 
  DROP CONSTRAINT IF EXISTS interviews_author_id_fkey;

ALTER TABLE activities 
  DROP CONSTRAINT IF EXISTS activities_author_id_fkey;

ALTER TABLE notifications 
  DROP CONSTRAINT IF EXISTS notifications_author_id_fkey;

-- Update the matches table to reference users instead of authors
ALTER TABLE matches 
  DROP CONSTRAINT IF EXISTS matches_author_id_fkey,
  ADD CONSTRAINT matches_author_id_fkey 
    FOREIGN KEY (author_id) 
    REFERENCES users(id) 
    ON DELETE CASCADE;

-- Update other tables to reference users instead of authors
ALTER TABLE interviews 
  ADD COLUMN user_id UUID REFERENCES users(id),
  -- Copy data if needed: UPDATE interviews SET user_id = author_id;
  DROP COLUMN author_id;

ALTER TABLE activities 
  ADD COLUMN user_id UUID REFERENCES users(id),
  -- Copy data if needed: UPDATE activities SET user_id = author_id;
  DROP COLUMN author_id;

ALTER TABLE notifications 
  ADD COLUMN user_id UUID REFERENCES users(id),
  -- Copy data if needed: UPDATE notifications SET user_id = author_id;
  DROP COLUMN author_id;

-- Finally, drop the authors table
DROP TRIGGER IF EXISTS update_authors_updated_at ON authors;
DROP TABLE IF EXISTS authors CASCADE; 