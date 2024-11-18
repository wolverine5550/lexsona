-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "moddatetime";

-- Create enum types for preferences
create type podcast_topic as enum (
  'technology',
  'business',
  'science',
  'health',
  'education',
  'entertainment',
  'news',
  'sports',
  'culture',
  'politics'
);

create type podcast_length as enum (
  'short',
  'medium',
  'long'
);

-- Create user preferences table
create table public.user_preferences (
  id uuid not null default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topics podcast_topic[] not null default '{}',
  preferred_length podcast_length not null default 'medium',
  style_preferences jsonb not null default '{
    "isInterviewPreferred": false,
    "isStorytellingPreferred": false,
    "isEducationalPreferred": false,
    "isDebatePreferred": false
  }',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),

  -- Constraints
  primary key (id),
  constraint user_preferences_user_id_key unique (user_id),
  constraint topics_length check (array_length(topics, 1) between 1 and 5)
);

-- Add RLS policies
alter table public.user_preferences enable row level security;

create policy "Users can view their own preferences"
  on public.user_preferences for select
  using (auth.uid() = user_id);

create policy "Users can insert their own preferences"
  on public.user_preferences for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own preferences"
  on public.user_preferences for update
  using (auth.uid() = user_id);

-- Add updated_at trigger
create trigger handle_updated_at before update
  on public.user_preferences
  for each row
  execute procedure moddatetime (updated_at); 