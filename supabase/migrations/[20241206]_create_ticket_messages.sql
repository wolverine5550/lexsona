-- Create staff_roles table if it doesn't exist
create table if not exists staff_roles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text not null check (role in ('admin', 'support')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id)
);

-- Enable RLS on staff_roles
alter table staff_roles enable row level security;

-- Create policies for staff_roles
create policy "Staff can view roles"
  on staff_roles for select
  using (auth.uid() in (select user_id from staff_roles));

-- Create the ticket_messages table
create table if not exists ticket_messages (
  id uuid default gen_random_uuid() primary key,
  ticket_id uuid references support_tickets(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  content text not null,
  is_staff boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table ticket_messages enable row level security;

-- Policies for ticket_messages
create policy "Users can view messages for their tickets"
  on ticket_messages for select
  using (
    auth.uid() = user_id or  -- User can see their own messages
    auth.uid() in (  -- Or if they're the ticket owner
      select user_id from support_tickets where id = ticket_id
    ) or
    auth.uid() in (  -- Or if they're staff
      select user_id from staff_roles where role = 'admin'
    )
  );

create policy "Users can create messages for their tickets"
  on ticket_messages for insert
  with check (
    auth.uid() = user_id and  -- Must be the message author
    (
      auth.uid() in (  -- Must be ticket owner
        select user_id from support_tickets where id = ticket_id
      ) or
      auth.uid() in (  -- Or must be staff
        select user_id from staff_roles where role = 'admin'
      )
    )
  );

-- Add realtime
alter publication supabase_realtime add table ticket_messages;

-- Insert admin user if needed (replace 'your-user-id' with your actual user ID)
-- insert into staff_roles (user_id, role)
-- values ('your-user-id', 'admin')
-- on conflict (user_id) do nothing;