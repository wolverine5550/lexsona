-- Enable required extensions
create extension if not exists "uuid-ossp";

-- Create enum types for podcast analysis
create type podcast_complexity_level as enum (
  'beginner',
  'intermediate',
  'advanced'
);

create type podcast_update_frequency as enum (
  'daily',
  'weekly',
  'monthly',
  'irregular'
);

-- Create table for podcast analysis results
create table public.podcast_analysis (
  id uuid not null default uuid_generate_v4(),
  podcast_id text not null,
  features jsonb not null,
  last_analyzed timestamp with time zone not null default now(),
  analysis_version text not null,
  confidence integer not null check (confidence between 0 and 100),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),

  primary key (id),
  constraint podcast_analysis_podcast_unique unique (podcast_id),
  constraint podcast_analysis_confidence_range check (confidence >= 0 and confidence <= 100)
);

-- Create table for episode analysis
create table public.episode_analysis (
  id uuid not null default uuid_generate_v4(),
  episode_id text not null,
  podcast_id text not null,
  topics text[] not null default '{}',
  key_points text[] not null default '{}',
  guest_experts text[] default '{}',
  content_type text[] not null default '{}',
  analyzed_at timestamp with time zone not null default now(),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),

  primary key (id),
  constraint episode_analysis_episode_unique unique (episode_id),
  foreign key (podcast_id) references public.podcast_analysis(podcast_id) on delete cascade
);

-- Create table for analysis metrics
create table public.analysis_metrics (
  id uuid not null default uuid_generate_v4(),
  podcast_id text not null,
  accuracy_score integer not null check (accuracy_score between 0 and 100),
  user_feedback_score integer check (user_feedback_score between 0 and 100),
  processing_time integer not null, -- in milliseconds
  error_count integer not null default 0,
  created_at timestamp with time zone not null default now(),

  primary key (id),
  foreign key (podcast_id) references public.podcast_analysis(podcast_id) on delete cascade
);

-- Add indexes for performance
create index idx_podcast_analysis_podcast_id on public.podcast_analysis(podcast_id);
create index idx_episode_analysis_podcast_id on public.episode_analysis(podcast_id);
create index idx_analysis_metrics_podcast_id on public.analysis_metrics(podcast_id);

-- Add updated_at triggers
create trigger handle_podcast_analysis_updated_at before update
  on public.podcast_analysis
  for each row
  execute procedure moddatetime (updated_at);

create trigger handle_episode_analysis_updated_at before update
  on public.episode_analysis
  for each row
  execute procedure moddatetime (updated_at);

-- Add RLS policies
alter table public.podcast_analysis enable row level security;
alter table public.episode_analysis enable row level security;
alter table public.analysis_metrics enable row level security;

-- Allow read access to authenticated users
create policy "Users can read podcast analysis"
  on public.podcast_analysis for select
  using (auth.role() = 'authenticated');

create policy "Users can read episode analysis"
  on public.episode_analysis for select
  using (auth.role() = 'authenticated');

create policy "Users can read analysis metrics"
  on public.analysis_metrics for select
  using (auth.role() = 'authenticated');

-- Allow service role to manage analysis data
create policy "Service role can manage podcast analysis"
  on public.podcast_analysis for all
  using (auth.role() = 'service_role');

create policy "Service role can manage episode analysis"
  on public.episode_analysis for all
  using (auth.role() = 'service_role');

create policy "Service role can manage analysis metrics"
  on public.analysis_metrics for all
  using (auth.role() = 'service_role'); 