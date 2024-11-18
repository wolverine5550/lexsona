-- Create error logs table for tracking system errors and issues
create table if not exists error_logs (
  id uuid default gen_random_uuid() primary key,
  timestamp timestamptz not null default now(),
  error_type text not null,
  message text not null,
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
  context jsonb not null default '{}'::jsonb,
  status text not null check (status in ('new', 'investigating', 'resolved')) default 'new',
  resolution text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Add indexes for common queries
create index if not exists error_logs_timestamp_idx on error_logs (timestamp);
create index if not exists error_logs_severity_idx on error_logs (severity);
create index if not exists error_logs_status_idx on error_logs (status);
create index if not exists error_logs_error_type_idx on error_logs (error_type);

-- Add a GiST index for the JSONB context column for efficient querying
create index if not exists error_logs_context_idx on error_logs using gin (context);

-- Add trigger for updating updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_error_logs_updated_at
  before update on error_logs
  for each row
  execute function update_updated_at_column();

-- Add RLS policies
alter table error_logs enable row level security;

-- Only authenticated users can view errors
create policy "Authenticated users can view errors"
  on error_logs for select
  to authenticated
  using (true);

-- Only service role can insert/update errors
create policy "Service role can manage errors"
  on error_logs for all
  to service_role
  using (true)
  with check (true);

-- Comments for documentation
comment on table error_logs is 'System error logs and issues tracking';
comment on column error_logs.error_type is 'Type/category of the error';
comment on column error_logs.severity is 'Error severity level (low, medium, high, critical)';
comment on column error_logs.context is 'Additional error context data in JSON format';
comment on column error_logs.status is 'Current status of the error (new, investigating, resolved)';
comment on column error_logs.resolution is 'Description of how the error was resolved'; 