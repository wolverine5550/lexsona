/**
* SAVED_PODCASTS
* Note: Tracks user's saved/favorited podcasts and their preferences
*/
create table saved_podcasts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  podcast_id text references podcasts(id) on delete cascade,
  status text not null check (
    status in (
      'saved',      -- User saved for later
      'favorite',   -- User marked as favorite
      'hidden',     -- User chose to hide/ignore
      'archived'    -- User archived from active list
    )
  ) default 'saved',
  notes text,                           -- Optional user notes
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  -- Ensure user can't save same podcast multiple times
  unique(user_id, podcast_id)
);

-- Add indexes for performance
create index saved_podcasts_user_id_idx on saved_podcasts(user_id);
create index saved_podcasts_status_idx on saved_podcasts(status);

-- Add RLS policies
alter table saved_podcasts enable row level security;

-- Users can only view their own saved podcasts
create policy "Users can view own saved podcasts"
  on saved_podcasts for select using (auth.uid() = user_id);

-- Users can save/update their own saved podcasts
create policy "Users can save podcasts"
  on saved_podcasts for insert with check (auth.uid() = user_id);

create policy "Users can update own saved podcasts"
  on saved_podcasts for update using (auth.uid() = user_id);

create policy "Users can delete own saved podcasts"
  on saved_podcasts for delete using (auth.uid() = user_id); 