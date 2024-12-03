-- Create ticket attachments table
create table if not exists ticket_attachments (
    id uuid default gen_random_uuid() primary key,
    ticket_id uuid references support_tickets(id) on delete cascade not null,
    message_id uuid references ticket_messages(id) on delete cascade,
    file_name text not null,
    file_type text not null,
    file_size bigint not null,
    storage_path text not null,
    created_at timestamptz default now() not null,
    created_by uuid references auth.users(id) on delete cascade not null
);

-- Create indexes
create index ticket_attachments_ticket_id_idx on ticket_attachments(ticket_id);
create index ticket_attachments_message_id_idx on ticket_attachments(message_id);

-- Enable RLS
alter table ticket_attachments enable row level security;

-- Create policies
-- Users can view attachments for their tickets
create policy "Users can view ticket attachments"
    on ticket_attachments for select
    using (
        exists (
            select 1 from support_tickets
            where support_tickets.id = ticket_attachments.ticket_id
            and support_tickets.user_id = auth.uid()
        )
    );

-- Users can create attachments for their tickets
create policy "Users can create ticket attachments"
    on ticket_attachments for insert
    with check (
        exists (
            select 1 from support_tickets
            where support_tickets.id = ticket_attachments.ticket_id
            and support_tickets.user_id = auth.uid()
        )
        and auth.uid() = created_by
    );

-- Users can delete their own attachments
create policy "Users can delete own attachments"
    on ticket_attachments for delete
    using (
        exists (
            select 1 from support_tickets
            where support_tickets.id = ticket_attachments.ticket_id
            and support_tickets.user_id = auth.uid()
        )
        and auth.uid() = created_by
    ); 