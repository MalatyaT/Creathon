-- Separates the anaokulu (topluluk) and LGS/YKS (topluluk-egitim) feeds, which
-- previously shared one unfiltered table and bled into each other outside of
-- manual tag filters. All existing rows are pre-existing anaokulu activities.

ALTER TABLE public.community_posts ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'anaokulu';
