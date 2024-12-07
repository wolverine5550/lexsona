-- First, create new consolidated tables

-- 1. Consolidate user activities
CREATE TABLE IF NOT EXISTS user_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('activity', 'notification', 'search')),
    title TEXT NOT NULL,
    description TEXT,
    metadata JSONB,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Consolidate collections system
CREATE TABLE IF NOT EXISTS user_collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('collection', 'tag', 'note')),
    name TEXT NOT NULL,
    description TEXT,
    items JSONB NOT NULL DEFAULT '[]',
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Consolidate message system
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('email', 'template')),
    subject TEXT,
    content TEXT,
    metadata JSONB, -- For attachments, template data, etc.
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Function to safely check if a table exists
CREATE OR REPLACE FUNCTION table_exists(tbl_name text) RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = tbl_name
    );
END;
$$ LANGUAGE plpgsql;

-- Function to safely check if a column exists
CREATE OR REPLACE FUNCTION column_exists(tbl_name text, col_name text) RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = tbl_name 
        AND column_name = col_name
    );
END;
$$ LANGUAGE plpgsql;

-- Now migrate data from old tables to new ones, but only if they exist
DO $$ 
BEGIN
    -- Migrate activities if they exist
    IF table_exists('activities') THEN
        IF column_exists('activities', 'user_id') THEN
            INSERT INTO user_activities (user_id, type, title, description, created_at)
            SELECT user_id, 'activity', title, description, created_at FROM activities
            WHERE user_id IS NOT NULL;
        END IF;
    END IF;

    -- Migrate notifications if they exist
    IF table_exists('notifications') THEN
        IF column_exists('notifications', 'user_id') THEN
            INSERT INTO user_activities (user_id, type, title, description, created_at)
            SELECT user_id, 'notification', title, description, created_at FROM notifications
            WHERE user_id IS NOT NULL;
        END IF;
    END IF;

    -- Migrate search history if it exists
    IF table_exists('search_history') THEN
        IF column_exists('search_history', 'user_id') THEN
            INSERT INTO user_activities (user_id, type, title, metadata, created_at)
            SELECT 
                user_id, 
                'search', 
                query, 
                jsonb_build_object('query', query),
                created_at 
            FROM search_history
            WHERE user_id IS NOT NULL;
        END IF;
    END IF;

    -- Migrate collections if they exist
    IF table_exists('podcast_collections') THEN
        IF column_exists('podcast_collections', 'user_id') THEN
            INSERT INTO user_collections (user_id, type, name, description, items, created_at)
            SELECT 
                user_id,
                'collection',
                name,
                description,
                jsonb_agg(jsonb_build_object('match_id', ci.match_id, 'added_at', ci.added_at))::jsonb,
                pc.created_at
            FROM podcast_collections pc
            LEFT JOIN collection_items ci ON ci.collection_id = pc.id
            WHERE pc.user_id IS NOT NULL
            GROUP BY pc.id, pc.user_id, pc.name, pc.description, pc.created_at;
        END IF;
    END IF;

    -- Migrate tags if they exist
    IF table_exists('podcast_tags') THEN
        IF column_exists('podcast_tags', 'user_id') THEN
            INSERT INTO user_collections (user_id, type, name, items, created_at)
            SELECT 
                user_id,
                'tag',
                name,
                jsonb_agg(jsonb_build_object('match_id', mt.match_id, 'added_at', mt.added_at))::jsonb,
                pt.created_at
            FROM podcast_tags pt
            LEFT JOIN match_tags mt ON mt.tag_id = pt.id
            WHERE pt.user_id IS NOT NULL
            GROUP BY pt.id, pt.user_id, pt.name, pt.created_at;
        END IF;
    END IF;

    -- Migrate email drafts if they exist
    IF table_exists('email_drafts') THEN
        IF column_exists('email_drafts', 'user_id') THEN
            INSERT INTO messages (user_id, type, subject, content, metadata, status, created_at)
            SELECT 
                user_id,
                'email',
                subject,
                content,
                jsonb_build_object(
                    'attachments', (
                        SELECT jsonb_agg(jsonb_build_object('filename', filename, 'url', url))
                        FROM email_attachments
                        WHERE draft_id = email_drafts.id
                    ),
                    'to', recipient_email,
                    'cc', cc_emails,
                    'bcc', bcc_emails
                ),
                status,
                created_at
            FROM email_drafts
            WHERE user_id IS NOT NULL;
        END IF;
    END IF;

    -- Migrate message templates if they exist
    IF table_exists('message_templates') THEN
        IF column_exists('message_templates', 'user_id') THEN
            INSERT INTO messages (user_id, type, subject, content, metadata, created_at)
            SELECT 
                user_id,
                'template',
                name,
                content,
                jsonb_build_object(
                    'category', tc.name,
                    'placeholders', (
                        SELECT jsonb_agg(jsonb_build_object('key', key, 'description', description))
                        FROM template_placeholders
                        WHERE template_id = message_templates.id
                    )
                ),
                message_templates.created_at
            FROM message_templates
            LEFT JOIN template_categories tc ON tc.id = message_templates.category_id
            WHERE message_templates.user_id IS NOT NULL;
        END IF;
    END IF;
END $$;

-- Add indexes for performance
CREATE INDEX idx_user_activities_user ON user_activities(user_id);
CREATE INDEX idx_user_activities_type ON user_activities(type);
CREATE INDEX idx_user_collections_user ON user_collections(user_id);
CREATE INDEX idx_user_collections_type ON user_collections(type);
CREATE INDEX idx_messages_user ON messages(user_id);
CREATE INDEX idx_messages_type ON messages(type);

-- Add triggers for updated_at
CREATE TRIGGER update_user_activities_timestamp
    BEFORE UPDATE ON user_activities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_collections_timestamp
    BEFORE UPDATE ON user_collections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_timestamp
    BEFORE UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 