-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "moddatetime";

-- Create table for OpenAI response cache
create table public.openai_cache (
  id uuid not null default uuid_generate_v4(),
  key text not null,
  entry jsonb not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),

  primary key (id),
  constraint openai_cache_key_unique unique (key)
);

-- Create table for analysis results cache
create table public.analysis_cache (
  id uuid not null default uuid_generate_v4(),
  key text not null,
  entry jsonb not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),

  primary key (id),
  constraint analysis_cache_key_unique unique (key)
);

-- Create indexes for performance
create index idx_openai_cache_key on public.openai_cache(key);
create index idx_openai_cache_expires on public.openai_cache((entry->>'expiresAt'));
create index idx_analysis_cache_key on public.analysis_cache(key);
create index idx_analysis_cache_expires on public.analysis_cache((entry->>'expiresAt'));

-- Add updated_at triggers
create trigger handle_openai_cache_updated_at before update
  on public.openai_cache
  for each row
  execute procedure moddatetime (updated_at);

create trigger handle_analysis_cache_updated_at before update
  on public.analysis_cache
  for each row
  execute procedure moddatetime (updated_at);

-- Add RLS policies
alter table public.openai_cache enable row level security;
alter table public.analysis_cache enable row level security;

-- Allow read access to authenticated users
create policy "Authenticated users can read OpenAI cache"
  on public.openai_cache for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can read analysis cache"
  on public.analysis_cache for select
  using (auth.role() = 'authenticated');

-- Allow service role to manage cache
create policy "Service role can manage OpenAI cache"
  on public.openai_cache for all
  using (auth.role() = 'service_role');

create policy "Service role can manage analysis cache"
  on public.analysis_cache for all
  using (auth.role() = 'service_role');