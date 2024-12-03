-- Create enum for ticket status
create type ticket_status as enum ('open', 'in_progress', 'resolved', 'closed');

-- Create support tickets table
create table if not exists support_tickets (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    title text not null,
    description text not null,
    category text not null,
    status ticket_status default 'open' not null,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null,
    last_updated_by uuid references auth.users(id)
);

-- Create index for user_id for faster lookups
create index support_tickets_user_id_idx on support_tickets(user_id);

-- Create index for status for filtering
create index support_tickets_status_idx on support_tickets(status);

-- Set up row level security
alter table support_tickets enable row level security;

-- Create policies
-- Users can view their own tickets
create policy "Users can view own tickets"
    on support_tickets for select
    using (auth.uid() = user_id);

-- Users can create tickets
create policy "Users can create tickets"
    on support_tickets for insert
    with check (auth.uid() = user_id);

-- Users can update their own tickets
create policy "Users can update own tickets"
    on support_tickets for update
    using (auth.uid() = user_id);

-- Create updated_at trigger
create or replace function handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger set_updated_at
    before update on support_tickets
    for each row
    execute procedure handle_updated_at(); 