-- Create ticket messages table
create table if not exists ticket_messages (
    id uuid default gen_random_uuid() primary key,
    ticket_id uuid references support_tickets(id) on delete cascade not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    content text not null,
    is_staff boolean default false not null,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

-- Create indexes
create index ticket_messages_ticket_id_idx on ticket_messages(ticket_id);
create index ticket_messages_user_id_idx on ticket_messages(user_id);

-- Enable RLS
alter table ticket_messages enable row level security;

-- Create policies
-- Users can view messages for their tickets
create policy "Users can view ticket messages"
    on ticket_messages for select
    using (
        exists (
            select 1 from support_tickets
            where support_tickets.id = ticket_messages.ticket_id
            and support_tickets.user_id = auth.uid()
        )
    );

-- Users can create messages for their tickets
create policy "Users can create ticket messages"
    on ticket_messages for insert
    with check (
        exists (
            select 1 from support_tickets
            where support_tickets.id = ticket_messages.ticket_id
            and support_tickets.user_id = auth.uid()
        )
        and auth.uid() = user_id
        and is_staff = false
    );

-- Create updated_at trigger
create trigger set_message_updated_at
    before update on ticket_messages
    for each row
    execute procedure handle_updated_at(); 