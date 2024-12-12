-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.podcast_analysis;
DROP TABLE IF EXISTS public.author_analysis;

-- Create podcast_analysis table with proper foreign key
CREATE TABLE public.podcast_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    podcast_id TEXT NOT NULL REFERENCES public.podcasts(id) ON DELETE CASCADE,
    host_style TEXT,
    audience_level TEXT,
    topics TEXT[],
    confidence FLOAT,
    analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create author_analysis table
CREATE TABLE public.author_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    topics TEXT[],
    expertise_level TEXT,
    communication_style TEXT,
    key_points TEXT[],
    preferred_formats TEXT[],
    target_audience TEXT[],
    content_boundaries TEXT[],
    confidence FLOAT,
    analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_podcast_analysis_podcast_id ON public.podcast_analysis(podcast_id);
CREATE INDEX idx_author_analysis_author_id ON public.author_analysis(author_id);
CREATE INDEX idx_podcast_analysis_analyzed_at ON public.podcast_analysis(analyzed_at);
CREATE INDEX idx_author_analysis_analyzed_at ON public.author_analysis(analyzed_at);

-- Enable Row Level Security
ALTER TABLE public.podcast_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.author_analysis ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for podcast_analysis
CREATE POLICY "Enable read access for authenticated users on podcast_analysis"
    ON public.podcast_analysis
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert for authenticated users on podcast_analysis"
    ON public.podcast_analysis
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users on podcast_analysis"
    ON public.podcast_analysis
    FOR UPDATE
    TO authenticated
    USING (true);

-- Create RLS policies for author_analysis
CREATE POLICY "Users can read their own author analysis"
    ON public.author_analysis
    FOR SELECT
    TO authenticated
    USING (auth.uid() = author_id);

CREATE POLICY "Users can insert their own author analysis"
    ON public.author_analysis
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own author analysis"
    ON public.author_analysis
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = author_id);

-- Add update triggers for timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_podcast_analysis_updated_at
    BEFORE UPDATE ON public.podcast_analysis
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_author_analysis_updated_at
    BEFORE UPDATE ON public.author_analysis
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 