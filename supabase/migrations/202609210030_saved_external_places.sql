BEGIN;

-- Personal bookmarks for verified external search identities that have not
-- been promoted to a canonical Tavvy place. These rows are never public.
CREATE TABLE public.saved_external_places (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  external_id text NOT NULL CHECK (external_id ~ '^fsq:[0-9a-f]{24}$'),
  place_name text NOT NULL CHECK (length(btrim(place_name)) BETWEEN 1 AND 200),
  category text CHECK (category IS NULL OR length(category)<=120),
  city text CHECK (city IS NULL OR length(city)<=120),
  region text CHECK (region IS NULL OR length(region)<=120),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id,external_id)
);
CREATE INDEX saved_external_places_user_recent_idx
  ON public.saved_external_places(user_id,created_at DESC);
ALTER TABLE public.saved_external_places ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_external_saves ON public.saved_external_places
  FOR ALL TO authenticated USING (user_id=auth.uid()) WITH CHECK (user_id=auth.uid());
REVOKE ALL ON public.saved_external_places FROM PUBLIC,anon;
GRANT SELECT,INSERT,DELETE ON public.saved_external_places TO authenticated;

COMMIT;
