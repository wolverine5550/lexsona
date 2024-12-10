-- Enable RLS on all tables
ALTER TABLE public.contact_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;

-- Contact History Policies
CREATE POLICY "Users can view their own contact history"
ON public.contact_history
FOR SELECT
USING (auth.uid() = author_id);

CREATE POLICY "Users can insert their own contact history"
ON public.contact_history
FOR INSERT
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own contact history"
ON public.contact_history
FOR UPDATE
USING (auth.uid() = author_id);

-- Messages Policies
CREATE POLICY "Users can view their own messages"
ON public.messages
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own messages"
ON public.messages
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own messages"
ON public.messages
FOR UPDATE
USING (auth.uid() = user_id);

-- Matches Policies
CREATE POLICY "Users can view their own matches"
ON public.matches
FOR SELECT
USING (auth.uid() = author_id);

CREATE POLICY "Users can insert their own matches"
ON public.matches
FOR INSERT
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own matches"
ON public.matches
FOR UPDATE
USING (auth.uid() = author_id);

-- Interviews Policies
CREATE POLICY "Users can view their own interviews"
ON public.interviews
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own interviews"
ON public.interviews
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interviews"
ON public.interviews
FOR UPDATE
USING (auth.uid() = user_id);

-- Add delete policies
CREATE POLICY "Users can delete their own contact history"
ON public.contact_history
FOR DELETE
USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own messages"
ON public.messages
FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own matches"
ON public.matches
FOR DELETE
USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own interviews"
ON public.interviews
FOR DELETE
USING (auth.uid() = user_id); 