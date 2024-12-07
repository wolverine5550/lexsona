-- Check if ticket_messages table exists and migrate data if it does
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename = 'ticket_messages'
    ) THEN
        -- Migrate existing ticket messages to the new messages table
        INSERT INTO messages (
            user_id,
            type,
            content,
            metadata,
            status,
            created_at,
            updated_at
        )
        SELECT 
            user_id,
            'ticket' as type,
            content,
            jsonb_build_object(
                'ticket_id', ticket_id,
                'sender_type', CASE WHEN is_staff THEN 'staff' ELSE 'user' END
            ) as metadata,
            'read' as status,
            created_at,
            COALESCE(updated_at, created_at) as updated_at
        FROM ticket_messages
        ON CONFLICT (id) DO NOTHING;

        -- Drop the old ticket_messages table
        DROP TABLE ticket_messages CASCADE;
    END IF;
END $$; 