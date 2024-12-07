-- Update the foreign key constraint
ALTER TABLE public.matches 
DROP CONSTRAINT matches_author_id_fkey,
ADD CONSTRAINT matches_author_id_fkey 
    FOREIGN KEY (author_id) 
    REFERENCES users(id) 
    ON DELETE CASCADE;