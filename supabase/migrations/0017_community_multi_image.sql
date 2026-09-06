-- Allows a community post to carry multiple images (e.g. a list of materials needed for an activity).

ALTER TABLE public.community_posts ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}'::text[] NOT NULL;
