/**
* SEARCH_HISTORY
* Note: Tracks user's podcast search history and interactions
*/
create table search_history (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  query text not null,                    -- Search query text
  filters jsonb,                          -- Search filters used
  results_count integer,                  -- Number of results found
  clicked_results text[],                 -- Array of podcast IDs that were clicked
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Add constraint to limit history per user (optional)
  constraint search_history_user_limit unique (user_id, created_at)
);

-- Add indexes for performance
create index search_history_user_id_idx on search_history(user_id);
create index search_history_created_at_idx on search_history(created_at);

-- Add RLS policies
alter table search_history enable row level security;

-- Users can only view their own search history
create policy "Users can view own search history"
  on search_history for select using (auth.uid() = user_id);

-- Users can create their own search history entries
create policy "Users can create search history"
  on search_history for insert with check (auth.uid() = user_id);

-- Users can delete their own search history
create policy "Users can delete search history"
  on search_history for delete using (auth.uid() = user_id);

-- Add function to clean up old search history (older than 30 days)
create or replace function cleanup_search_history()
returns trigger as $$
begin
  delete from search_history
  where created_at < now() - interval '30 days';
  return NEW;
end;
$$ language plpgsql security definer;

-- Add trigger to automatically clean up old history
create trigger cleanup_old_search_history
  after insert on search_history
  for each row
  execute function cleanup_search_history();