-- Create enum for email status
CREATE TYPE email_status AS ENUM ('draft', 'scheduled', 'sent');

-- Create email drafts table
CREATE TABLE email_drafts (
    -- Basic identification
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Core email content
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    status email_status NOT NULL DEFAULT 'draft',
    
    -- Recipient information
    recipient_email TEXT,
    recipient_name TEXT,
    
    -- Template reference (optional)
    template_id UUID REFERENCES message_templates(id),
    
    -- Scheduling
    scheduled_for TIMESTAMP WITH TIME ZONE,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    created_by UUID NOT NULL REFERENCES auth.users(id),
    last_modified_by UUID NOT NULL REFERENCES auth.users(id),
    
    -- Additional data
    metadata JSONB, -- For flexible additional properties
    attachments JSONB[] -- Array of attachment metadata
);

-- Create email attachments table
CREATE TABLE email_attachments (
    -- Basic identification
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email_id UUID NOT NULL REFERENCES email_drafts(id) ON DELETE CASCADE,
    
    -- File information
    file_name TEXT NOT NULL,
    file_size INTEGER NOT NULL, -- in bytes
    file_type TEXT NOT NULL, -- MIME type
    storage_path TEXT NOT NULL, -- Path in Supabase Storage
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    created_by UUID NOT NULL REFERENCES auth.users(id)
);

-- Create indexes for common query patterns
CREATE INDEX idx_email_drafts_status ON email_drafts(status);
CREATE INDEX idx_email_drafts_created_by ON email_drafts(created_by);
CREATE INDEX idx_email_drafts_scheduled_for ON email_drafts(scheduled_for) 
    WHERE status = 'scheduled';
CREATE INDEX idx_email_drafts_template ON email_drafts(template_id) 
    WHERE template_id IS NOT NULL;
CREATE INDEX idx_email_attachments_email ON email_attachments(email_id);

-- Enable Row Level Security (RLS)
ALTER TABLE email_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_drafts

-- Allow users to view their own drafts
CREATE POLICY "Users can view their own email drafts"
    ON email_drafts
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() = created_by
        OR auth.uid() = last_modified_by
        OR EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Allow users to create new drafts
CREATE POLICY "Users can create new email drafts"
    ON email_drafts
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = created_by);

-- Allow users to update their own drafts
CREATE POLICY "Users can update their own email drafts"
    ON email_drafts
    FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = created_by
        OR auth.uid() = last_modified_by
        OR EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    )
    WITH CHECK (
        auth.uid() = created_by
        OR auth.uid() = last_modified_by
        OR EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Allow users to delete their own drafts
CREATE POLICY "Users can delete their own email drafts"
    ON email_drafts
    FOR DELETE
    TO authenticated
    USING (
        auth.uid() = created_by
        OR EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- RLS Policies for email_attachments

-- Allow users to view attachments of their drafts
CREATE POLICY "Users can view attachments of their drafts"
    ON email_attachments
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM email_drafts
            WHERE email_drafts.id = email_attachments.email_id
            AND (
                email_drafts.created_by = auth.uid()
                OR email_drafts.last_modified_by = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM auth.users
                    WHERE auth.users.id = auth.uid()
                    AND auth.users.raw_user_meta_data->>'role' = 'admin'
                )
            )
        )
    );

-- Allow users to add attachments to their drafts
CREATE POLICY "Users can add attachments to their drafts"
    ON email_attachments
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM email_drafts
            WHERE email_drafts.id = email_id
            AND (
                email_drafts.created_by = auth.uid()
                OR email_drafts.last_modified_by = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM auth.users
                    WHERE auth.users.id = auth.uid()
                    AND auth.users.raw_user_meta_data->>'role' = 'admin'
                )
            )
        )
    );

-- Allow users to delete attachments from their drafts
CREATE POLICY "Users can delete attachments from their drafts"
    ON email_attachments
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM email_drafts
            WHERE email_drafts.id = email_attachments.email_id
            AND (
                email_drafts.created_by = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM auth.users
                    WHERE auth.users.id = auth.uid()
                    AND auth.users.raw_user_meta_data->>'role' = 'admin'
                )
            )
        )
    ); 