-- Create tables for prompt management
create table public.prompt_templates (
  id uuid not null default uuid_generate_v4(),
  version text not null,
  template text not null,
  created_at timestamp with time zone not null default now(),
  
  primary key (id),
  constraint prompt_templates_version_key unique (version)
);

-- Create table for prompt performance metrics
create table public.prompt_metrics (
  version text not null,
  success_rate float not null default 0,
  avg_relevance_score float not null default 0,
  total_uses integer not null default 0,
  error_rate float not null default 0,
  avg_response_time float not null default 0,
  last_used_at timestamp with time zone not null default now(),
  
  primary key (version),
  constraint prompt_metrics_version_fkey 
    foreign key (version) 
    references prompt_templates(version) 
    on delete cascade
);

-- Add RLS policies
alter table public.prompt_templates enable row level security;
alter table public.prompt_metrics enable row level security;

-- Allow read access to authenticated users
create policy "Authenticated users can read prompt templates"
  on public.prompt_templates for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can read prompt metrics"
  on public.prompt_metrics for select
  using (auth.role() = 'authenticated');

-- Allow service role to manage prompts
create policy "Service role can manage prompt templates"
  on public.prompt_templates for all
  using (auth.role() = 'service_role');

create policy "Service role can manage prompt metrics"
  on public.prompt_metrics for all
  using (auth.role() = 'service_role'); 