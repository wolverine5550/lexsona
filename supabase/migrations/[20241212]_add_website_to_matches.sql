-- Add website to matches view
DROP VIEW IF EXISTS public.matches;

CREATE OR REPLACE VIEW public.matches AS
SELECT 
    p.id,
    p.title,
    p.description,
    p.image,
    p.categories,
    p.topics,
    p.website,
    p.language,
    p.country,
    p.explicit_content,
    p.total_episodes,
    p.listennotes_url,
    p.publisher,
    pa.expertise_level,
    pa.content_quality,
    pa.production_quality,
    pa.engagement_level,
    pa.educational_value,
    pa.family_friendly,
    pa.personality_insights,
    pa.content_warnings,
    pa.analyzed_at,
    aa.expertise_level as host_expertise,
    aa.communication_style,
    aa.personality_traits,
    aa.analyzed_at as host_analyzed_at
FROM public.podcasts p
LEFT JOIN public.podcast_analysis pa ON p.id = pa.podcast_id
LEFT JOIN public.author_analysis aa ON p.id = aa.podcast_id
WHERE pa.analyzed_at IS NOT NULL
AND aa.analyzed_at IS NOT NULL;

-- Add RLS policy
ALTER VIEW public.matches OWNER TO authenticated;
GRANT ALL ON public.matches TO authenticated;
GRANT ALL ON public.matches TO service_role;

-- Update the seed data to include website URLs
UPDATE public.podcasts 
SET website = CASE 
    WHEN id = '1' THEN 'https://example1.com'
    WHEN id = '2' THEN 'https://example2.com'
    WHEN id = '3' THEN 'https://example3.com'
    ELSE website
END
WHERE id IN ('1', '2', '3'); 