-- Create materialized view for optimized podcast recommendations
create materialized view if not exists podcast_recommendations_mv as
select 
  p.id as podcast_id,
  up.user_id,
  p.title,
  p.description,
  p.categories,
  p.style,
  (
    -- Calculate match score based on available factors
    case when p.categories && up.preferred_categories then 0.6 else 0 end +
    case when p.style = up.preferred_style then 0.4 else 0 end
  ) as match_score
from 
  podcasts p
cross join 
  user_preferences up;

-- Add indexes for faster querying
create index if not exists podcast_recommendations_mv_user_id_idx 
  on podcast_recommendations_mv (user_id);
create index if not exists podcast_recommendations_mv_match_score_idx 
  on podcast_recommendations_mv (match_score desc);

-- Create function to refresh materialized view
create or replace function refresh_podcast_recommendations_mv()
returns trigger as $$
begin
  refresh materialized view concurrently podcast_recommendations_mv;
  return null;
end;
$$ language plpgsql;

-- Create triggers to refresh materialized view
create trigger refresh_recommendations_on_podcast_change
  after insert or update or delete on podcasts
  for each statement
  execute function refresh_podcast_recommendations_mv();

create trigger refresh_recommendations_on_preference_change
  after insert or update or delete on user_preferences
  for each statement
  execute function refresh_podcast_recommendations_mv();

-- Comments for documentation
comment on materialized view podcast_recommendations_mv is 'Precalculated podcast recommendations for faster querying';
comment on function refresh_podcast_recommendations_mv() is 'Function to refresh podcast recommendations materialized view'; 