-- Performance fix: the grid list query was pulling every post's full-size
-- image/PDF data (hundreds of KB each) just to render a small card thumbnail,
-- making the activity feed take several seconds to load. New uploads now also
-- generate a small (~200px) cover thumbnail; the list query fetches only this.

ALTER TABLE public.community_posts ADD COLUMN IF NOT EXISTS cover_thumbnail text;
ALTER TABLE public.community_posts ADD COLUMN IF NOT EXISTS cover_is_pdf boolean NOT NULL DEFAULT false;
ALTER TABLE public.community_posts ADD COLUMN IF NOT EXISTS image_count integer NOT NULL DEFAULT 0;
