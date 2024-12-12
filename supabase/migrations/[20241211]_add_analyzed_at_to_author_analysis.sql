-- Check if analyzed_at column exists and add if it doesn't
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'author_analysis' 
        AND column_name = 'analyzed_at'
    ) THEN
        -- Add analyzed_at column to author_analysis table
        ALTER TABLE public.author_analysis
        ADD COLUMN analyzed_at timestamp with time zone DEFAULT current_timestamp;

        -- Update existing rows to have analyzed_at set to their creation time
        UPDATE public.author_analysis
        SET analyzed_at = created_at
        WHERE analyzed_at IS NULL;

        -- Make analyzed_at not nullable
        ALTER TABLE public.author_analysis
        ALTER COLUMN analyzed_at SET NOT NULL;
    END IF;
END $$;

-- Check if index exists and create if it doesn't
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE schemaname = 'public'
        AND tablename = 'author_analysis'
        AND indexname = 'idx_author_analysis_analyzed_at'
    ) THEN
        -- Add an index for faster timestamp comparisons
        CREATE INDEX idx_author_analysis_analyzed_at 
        ON public.author_analysis(analyzed_at);
    END IF;
END $$;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS update_author_analysis_analyzed_at ON public.author_analysis;
DROP FUNCTION IF EXISTS update_author_analysis_analyzed_at();

-- Create or replace the trigger function
CREATE OR REPLACE FUNCTION update_author_analysis_analyzed_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.analyzed_at = current_timestamp;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER update_author_analysis_analyzed_at
    BEFORE UPDATE ON public.author_analysis
    FOR EACH ROW
    EXECUTE FUNCTION update_author_analysis_analyzed_at(); 