-- Drop the authors table and its dependencies
DROP TRIGGER IF EXISTS update_authors_updated_at ON public.authors;
DROP TABLE IF EXISTS public.authors;