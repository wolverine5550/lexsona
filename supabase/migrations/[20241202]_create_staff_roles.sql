-- Drop existing policies first
drop policy if exists "Staff can view staff list" on staff_members;
drop policy if exists "Admins can manage staff" on staff_members;
drop policy if exists "Staff can view all tickets" on support_tickets;
drop policy if exists "Staff can update any ticket" on support_tickets;
drop policy if exists "Staff can view all messages" on ticket_messages;
drop policy if exists "Staff can create messages" on ticket_messages;

-- Skip enum creation since it exists
-- create type staff_role as enum ('support_agent', 'support_admin');

-- Create staff members table if not exists
create table if not exists staff_members (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade unique not null,
    role staff_role not null,
    is_active boolean default true not null,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

-- Create index if not exists
create index if not exists staff_members_user_id_idx on staff_members(user_id);

-- Enable RLS
alter table staff_members enable row level security;

-- Create policies
-- Staff members can view the staff list
create policy "Staff can view staff list"
    on staff_members for select
    using (
        auth.jwt()->>'role' = 'support_agent'
        or auth.jwt()->>'role' = 'support_admin'
    );

-- Only support admins can manage staff
create policy "Admins can manage staff"
    on staff_members for all
    using (
        auth.jwt()->>'role' = 'support_admin'
    );

-- Create staff policies for tickets
create policy "Staff can view all tickets"
    on support_tickets for select
    using (
        auth.jwt()->>'role' = 'support_agent'
        or auth.jwt()->>'role' = 'support_admin'
    );

create policy "Staff can update any ticket"
    on support_tickets for update
    using (
        auth.jwt()->>'role' = 'support_agent'
        or auth.jwt()->>'role' = 'support_admin'
    );

-- Create staff policies for messages
create policy "Staff can view all messages"
    on ticket_messages for select
    using (
        auth.jwt()->>'role' = 'support_agent'
        or auth.jwt()->>'role' = 'support_admin'
    );

create policy "Staff can create messages"
    on ticket_messages for insert
    with check (
        auth.jwt()->>'role' = 'support_agent'
        or auth.jwt()->>'role' = 'support_admin'
    );

-- Drop trigger if exists to avoid duplicate
drop trigger if exists set_staff_updated_at on staff_members;

-- Create updated_at trigger
create trigger set_staff_updated_at
    before update on staff_members
    for each row
    execute procedure handle_updated_at(); 