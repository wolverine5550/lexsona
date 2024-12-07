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