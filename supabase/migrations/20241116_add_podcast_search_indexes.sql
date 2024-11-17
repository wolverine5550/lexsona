-- Enable the pg_trgm extension for fuzzy text search
create extension if not exists pg_trgm;

-- Add GIN indexes for full-text search on podcasts table
create index if not exists podcasts_title_search_idx on podcasts 
using gin ((title || ' ' || description) gin_trgm_ops);

-- Add index for publisher name search
create index if not exists podcasts_publisher_search_idx on podcasts 
using gin (publisher gin_trgm_ops);

-- Add index for categories search (using JSONB operators)
create index if not exists podcasts_categories_search_idx on podcasts 
using gin (categories jsonb_path_ops);

-- Add function to generate podcast search document
create or replace function podcast_search_document(
  p_title text,
  p_description text,
  p_publisher text,
  p_categories jsonb
) returns text as $$
begin
  return p_title || ' ' || 
         p_description || ' ' || 
         p_publisher || ' ' || 
         coalesce((
           select string_agg(value->>'name', ' ')
           from jsonb_array_elements(p_categories)
         ), '');
end;
$$ language plpgsql immutable;

-- Add generated column for full-text search
alter table podcasts 
add column if not exists search_document tsvector
generated always as (
  to_tsvector('english', 
    podcast_search_document(
      title, 
      description, 
      publisher, 
      categories
    )
  )
) stored;

-- Add index on the search document
create index if not exists podcasts_search_idx on podcasts 
using gin(search_document);