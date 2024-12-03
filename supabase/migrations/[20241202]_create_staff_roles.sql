-- Create staff roles enum
create type staff_role as enum ('support_agent', 'support_admin');

-- Create staff members table
create table if not exists staff_members (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade unique not null,
    role staff_role not null,
    is_active boolean default true not null,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

-- Create index
create index staff_members_user_id_idx on staff_members(user_id);

-- Enable RLS
alter table staff_members enable row level security;

-- Create policies
-- Staff members can view the staff list
create policy "Staff can view staff list"
    on staff_members for select
    using (
        exists (
            select 1 from staff_members
            where staff_members.user_id = auth.uid()
            and is_active = true
        )
    );

-- Only support admins can manage staff
create policy "Admins can manage staff"
    on staff_members for all
    using (
        exists (
            select 1 from staff_members
            where staff_members.user_id = auth.uid()
            and role = 'support_admin'
            and is_active = true
        )
    );

-- Create staff policies for tickets
create policy "Staff can view all tickets"
    on support_tickets for select
    using (
        exists (
            select 1 from staff_members
            where staff_members.user_id = auth.uid()
            and is_active = true
        )
    );

create policy "Staff can update any ticket"
    on support_tickets for update
    using (
        exists (
            select 1 from staff_members
            where staff_members.user_id = auth.uid()
            and is_active = true
        )
    );

-- Create staff policies for messages
create policy "Staff can view all messages"
    on ticket_messages for select
    using (
        exists (
            select 1 from staff_members
            where staff_members.user_id = auth.uid()
            and is_active = true
        )
    );

create policy "Staff can create messages"
    on ticket_messages for insert
    with check (
        exists (
            select 1 from staff_members
            where staff_members.user_id = auth.uid()
            and is_active = true
        )
    );

-- Create updated_at trigger
create trigger set_staff_updated_at
    before update on staff_members
    for each row
    execute procedure handle_updated_at(); 