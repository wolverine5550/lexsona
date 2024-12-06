-- First create the ticket_priority enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ticket_priority') THEN
        create type ticket_priority as enum ('low', 'medium', 'high', 'urgent');
    END IF;
END $$;

-- Add priority column to support_tickets table
ALTER TABLE support_tickets 
ADD COLUMN IF NOT EXISTS priority ticket_priority DEFAULT 'medium' NOT NULL;

-- Drop existing policies
drop policy if exists "Users can create tickets" on support_tickets;
drop policy if exists "Users can update their own tickets" on support_tickets;

-- Recreate policies with priority constraints
create policy "Users can create tickets"
    on support_tickets for insert
    with check (
        auth.uid() = user_id 
        and priority = 'medium'  -- Enforce medium priority on insert
    );

create policy "Users can update their own tickets"
    on support_tickets for update
    using (
        auth.uid() = user_id 
    )
    with check (
        priority = (select priority from support_tickets where id = id)  -- Compare with existing priority
    );