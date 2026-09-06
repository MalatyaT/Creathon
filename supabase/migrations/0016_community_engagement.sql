-- Adds view counts, comments and delete permissions to the community activity feed.

ALTER TABLE public.community_posts ADD COLUMN IF NOT EXISTS views integer DEFAULT 0 NOT NULL;

CREATE POLICY "Allow public delete for community_posts" ON public.community_posts
    FOR DELETE
    USING (true);

CREATE TABLE IF NOT EXISTS public.community_post_comments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
    author text NOT NULL,
    role text NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.community_post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access for community_post_comments" ON public.community_post_comments
    FOR SELECT
    USING (true);

CREATE POLICY "Allow public insert for community_post_comments" ON public.community_post_comments
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow public delete for community_post_comments" ON public.community_post_comments
    FOR DELETE
    USING (true);
