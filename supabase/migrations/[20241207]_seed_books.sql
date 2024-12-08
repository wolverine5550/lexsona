-- Seed data for books table
INSERT INTO public.books (
    id,
    author_id,
    title,
    description,
    genre,
    target_audience,
    keywords,
    created_at,
    updated_at
) VALUES 
(
    gen_random_uuid(),
    (SELECT id FROM auth.users LIMIT 1), -- Get the first user's ID
    'The Future of AI',
    'A comprehensive guide to artificial intelligence and its impact on society',
    ARRAY['Technology', 'Science', 'Artificial Intelligence'],
    ARRAY['Tech Enthusiasts', 'Business Professionals', 'Students'],
    ARRAY['AI', 'machine learning', 'future technology', 'digital transformation'],
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    genre = EXCLUDED.genre,
    target_audience = EXCLUDED.target_audience,
    keywords = EXCLUDED.keywords,
    updated_at = NOW(); 