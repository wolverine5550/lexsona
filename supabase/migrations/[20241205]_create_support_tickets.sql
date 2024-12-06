-- Check if the enum type exists before creating it
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ticket_status') THEN
        create type ticket_status as enum ('open', 'in_progress', 'resolved', 'closed');
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ticket_priority') THEN
        create type ticket_priority as enum ('low', 'medium', 'high', 'urgent');
    END IF;
END $$;

create table if not exists support_tickets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  title text not null,
  description text not null,
  status ticket_status default 'open' not null,
  priority ticket_priority default 'medium' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  resolved_at timestamp with time zone
);

-- Enable RLS
alter table support_tickets enable row level security;

-- Create policies if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'support_tickets' AND policyname = 'Users can view their own tickets'
    ) THEN
        create policy "Users can view their own tickets"
            on support_tickets for select
            using (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'support_tickets' AND policyname = 'Users can create tickets'
    ) THEN
        create policy "Users can create tickets"
            on support_tickets for insert
            with check (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'support_tickets' AND policyname = 'Users can update their own tickets'
    ) THEN
        create policy "Users can update their own tickets"
            on support_tickets for update
            using (auth.uid() = user_id);
    END IF;
END $$;

-- Create updated_at trigger
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security definer
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS handle_updated_at ON support_tickets;
create trigger handle_updated_at
  before update
  on support_tickets
  for each row
  execute procedure public.handle_updated_at(); 