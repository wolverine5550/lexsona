INSERT INTO public.podcasts (
    id, 
    title, 
    publisher, 
    description, 
    categories,
    language,
    total_episodes
) VALUES 
('pod1', 'Tech Talks Daily', 'Tech Media', 'Daily discussions about technology, AI, and innovation', '["Technology", "AI"]', 'en', 100),
('pod2', 'Startup Stories', 'Founder Media', 'Interviews with successful entrepreneurs', '["Business", "Entrepreneurship"]', 'en', 75),
('pod3', 'AI Revolution', 'Future Labs', 'Deep dives into artificial intelligence and machine learning', '["Technology", "AI", "Science"]', 'en', 50)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    publisher = EXCLUDED.publisher,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    language = EXCLUDED.language,
    total_episodes = EXCLUDED.total_episodes;

-- Enable RLS
alter table public.podcasts enable row level security;

-- Allow authenticated users to read podcasts
create policy "Authenticated users can read podcasts"
  on public.podcasts for select
  using (auth.role() = 'authenticated');

-- Allow service role to manage podcasts
create policy "Service role can manage podcasts"
  on public.podcasts for all
  using (auth.role() = 'service_role');

-- Allow authenticated users to insert podcasts (needed for the listen-notes service)
create policy "Authenticated users can insert podcasts"
  on public.podcasts for insert
  with check (auth.role() = 'authenticated');

-- Allow authenticated users to update podcasts
create policy "Authenticated users can update podcasts"
  on public.podcasts for update
  using (auth.role() = 'authenticated');