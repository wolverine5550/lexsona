-- Create enum for template status
CREATE TYPE template_status AS ENUM ('draft', 'active', 'archived');

-- Create template categories table
CREATE TABLE template_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    color TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Add index for faster category name lookups
CREATE INDEX idx_template_categories_name ON template_categories(name);

-- Create message templates table
CREATE TABLE message_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    status template_status NOT NULL DEFAULT 'draft',
    category_id UUID NOT NULL REFERENCES template_categories(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    created_by UUID NOT NULL REFERENCES auth.users(id),
    last_modified_by UUID NOT NULL REFERENCES auth.users(id),
    is_default BOOLEAN DEFAULT FALSE,
    metadata JSONB
);

-- Create partial unique index to ensure only one default template per category
CREATE UNIQUE INDEX idx_unique_default_per_category 
    ON message_templates (category_id) 
    WHERE is_default = true;

-- Add indexes for common query patterns
CREATE INDEX idx_message_templates_category ON message_templates(category_id);
CREATE INDEX idx_message_templates_status ON message_templates(status);
CREATE INDEX idx_message_templates_created_by ON message_templates(created_by);
CREATE INDEX idx_message_templates_updated_at ON message_templates(updated_at DESC);

-- Create template placeholders table
CREATE TABLE template_placeholders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT NOT NULL,
    label TEXT NOT NULL,
    description TEXT,
    default_value TEXT,
    template_id UUID NOT NULL REFERENCES message_templates(id) ON DELETE CASCADE,
    UNIQUE(template_id, key)
);

-- Add index for faster placeholder lookups
CREATE INDEX idx_template_placeholders_template ON template_placeholders(template_id);

-- Add RLS (Row Level Security) policies
ALTER TABLE template_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_placeholders ENABLE ROW LEVEL SECURITY;

-- Template categories policies
CREATE POLICY "Allow read access to all authenticated users for template_categories"
    ON template_categories FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow template management for authenticated users"
    ON template_categories FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Message templates policies
CREATE POLICY "Allow read access to all authenticated users for message_templates"
    ON message_templates FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow template management for creators and editors"
    ON message_templates FOR ALL
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

-- Template placeholders policies
CREATE POLICY "Allow read access to all authenticated users for template_placeholders"
    ON template_placeholders FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow placeholder management through template association"
    ON template_placeholders FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM message_templates
            WHERE message_templates.id = template_id
            AND (
                message_templates.created_by = auth.uid()
                OR message_templates.last_modified_by = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM auth.users
                    WHERE auth.users.id = auth.uid()
                    AND auth.users.raw_user_meta_data->>'role' = 'admin'
                )
            )
        )
    ); 