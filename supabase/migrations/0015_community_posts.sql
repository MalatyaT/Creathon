CREATE TABLE IF NOT EXISTS public.community_posts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    content text NOT NULL,
    author text NOT NULL,
    role text NOT NULL,
    tags text[] DEFAULT '{}'::text[],
    image_base64 text,
    likes integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access for community_posts" ON public.community_posts
    FOR SELECT
    USING (true);

CREATE POLICY "Allow public insert for community_posts" ON public.community_posts
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow public update for community_posts" ON public.community_posts
    FOR UPDATE
    USING (true);
