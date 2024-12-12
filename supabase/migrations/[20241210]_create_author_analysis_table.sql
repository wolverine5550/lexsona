-- supabase/migrations/20240201_create_author_analysis_table.sql

-- Create the author_analysis table
CREATE TABLE author_analysis (
    id SERIAL PRIMARY KEY, -- Unique identifier for each analysis
    author_id VARCHAR NOT NULL, -- The ID of the author
    topics TEXT[], -- Array of topics
    expertise_level VARCHAR NOT NULL, -- Expertise level (beginner/intermediate/expert)
    communication_style VARCHAR NOT NULL, -- Communication style
    key_points TEXT[], -- Array of key points
    confidence NUMERIC NOT NULL, -- Confidence score
    analyzed_at TIMESTAMP NOT NULL DEFAULT NOW(), -- Timestamp of when the analysis was performed
    UNIQUE (author_id) -- Ensure that each author_id is unique for upsert operations
);

-- Add any necessary indexes for performance
CREATE INDEX idx_author_analysis_author_id ON author_analysis(author_id);