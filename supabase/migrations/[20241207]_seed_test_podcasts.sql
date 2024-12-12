-- Insert test podcasts
INSERT INTO public.podcasts (
    id,
    title,
    description,
    publisher,
    categories,
    total_episodes,
    listen_score,
    language,
    explicit_content,
    latest_pub_date_ms,
    cached_at,
    updated_at
) VALUES 
('test1', 'Tech Innovators', 'Deep dives into technology innovation and startups', 'Tech Media', 
    '[67, 127]'::jsonb, 100, 80, 'en', false, extract(epoch from now()) * 1000, now(), now()),
('test2', 'AI Revolution Weekly', 'Latest developments in artificial intelligence and machine learning', 'Future Labs', 
    '[125, 67]'::jsonb, 75, 85, 'en', false, extract(epoch from now()) * 1000, now(), now()),
('test3', 'Startup Success Stories', 'Interviews with successful entrepreneurs and business leaders', 'Founder Media', 
    '[93, 95]'::jsonb, 50, 75, 'en', false, extract(epoch from now()) * 1000, now(), now()),
('test4', 'Tech Leadership Today', 'Insights from technology leaders and innovators', 'Tech Insights', 
    '[67, 122]'::jsonb, 120, 70, 'en', false, extract(epoch from now()) * 1000, now(), now()),
('test5', 'Future of AI', 'Exploring the future of artificial intelligence and its impact', 'AI Research', 
    '[125, 111]'::jsonb, 60, 90, 'en', false, extract(epoch from now()) * 1000, now(), now());

-- Insert test podcast analysis
INSERT INTO public.podcast_analysis (
    podcast_id,
    host_style,
    audience_level,
    topics,
    confidence,
    analyzed_at
) VALUES 
('test1', 'interview', 'intermediate', ARRAY['technology', 'innovation', 'startups'], 0.9, now()),
('test2', 'educational', 'expert', ARRAY['artificial intelligence', 'machine learning', 'technology'], 0.85, now()),
('test3', 'conversational', 'beginner', ARRAY['business', 'entrepreneurship', 'startups'], 0.8, now()),
('test4', 'interview', 'intermediate', ARRAY['technology', 'leadership', 'innovation'], 0.75, now()),
('test5', 'educational', 'expert', ARRAY['artificial intelligence', 'technology', 'education'], 0.95, now()); 