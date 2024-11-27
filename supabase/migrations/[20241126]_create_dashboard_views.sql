/**
* VIEWS
* Note: Create views after all tables and functions are created
*/
DROP VIEW IF EXISTS author_stats;

CREATE OR REPLACE VIEW author_stats AS
SELECT 
    a.id as author_id,
    COUNT(DISTINCT matches.id) as total_matches,
    COUNT(DISTINCT CASE 
        WHEN matches.status::text = 'new' 
        THEN matches.id 
    END) as pending_requests,
    COUNT(DISTINCT CASE 
        WHEN interviews.status::text = 'scheduled'
        AND interviews.scheduled_date >= CURRENT_DATE 
        THEN interviews.id 
    END) as upcoming_interviews,
    0 as profile_views,
    MAX(GREATEST(
        matches.updated_at, 
        interviews.updated_at
    )) as updated_at
FROM authors a
LEFT JOIN matches ON matches.author_id = a.id
LEFT JOIN interviews ON interviews.author_id = a.id
GROUP BY a.id; 