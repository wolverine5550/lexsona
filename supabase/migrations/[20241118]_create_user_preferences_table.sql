-- Create user preferences table
create table if not exists user_preferences (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  preferred_categories text[] default array[]::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Add indexes
create index if not exists user_preferences_user_id_idx on user_preferences(user_id);

-- Add RLS policies
alter table user_preferences enable row level security;

create policy "Users can view their own preferences"
  on user_preferences for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can update their own preferences"
  on user_preferences for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Add trigger for updated_at
create trigger update_user_preferences_updated_at
  before update on user_preferences
  for each row
  execute function update_updated_at_column(); 