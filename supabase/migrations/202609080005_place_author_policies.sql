-- Deploy together with 006: FSQ promotion uses its narrow authenticated RPC.
-- Prepared only: review/apply independently. No existing content is modified.
-- Ownership precondition: review legacy tavvy_places.created_by values before
-- relying on them; the old INSERT policy allowed spoofing this field.
-- No client-controlled profile role/user metadata is trusted as admin authority.
-- Trusted service_role/backend administration continues to bypass RLS.
BEGIN;

DROP POLICY IF EXISTS tavvy_place_author_insert ON public.tavvy_places;
CREATE POLICY tavvy_place_author_insert ON public.tavvy_places AS RESTRICTIVE
FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
DROP POLICY IF EXISTS tavvy_place_author_update ON public.tavvy_places;
CREATE POLICY tavvy_place_author_update ON public.tavvy_places AS RESTRICTIVE
FOR UPDATE TO authenticated USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());

-- Canonical provenance must not be rewriteable, otherwise membership ownership
-- could be forged by repointing a places row at the caller's tavvy_places row.
CREATE OR REPLACE FUNCTION public.guard_place_provenance() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog AS $$
BEGIN
  IF auth.role() = 'authenticated' AND
    (NEW.id IS DISTINCT FROM OLD.id OR NEW.source_type IS DISTINCT FROM OLD.source_type
      OR NEW.source_id IS DISTINCT FROM OLD.source_id) THEN
    RAISE EXCEPTION 'Canonical place provenance cannot be changed by clients' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS guard_place_provenance_before_update ON public.places;
CREATE TRIGGER guard_place_provenance_before_update BEFORE UPDATE ON public.places
FOR EACH ROW EXECUTE FUNCTION public.guard_place_provenance();

-- The deployed tavvy_places sync trigger is SECURITY INVOKER. These policies
-- intentionally permit its canonical INSERT/UPDATE for the authenticated author.
DROP POLICY IF EXISTS canonical_author_insert ON public.places;
CREATE POLICY canonical_author_insert ON public.places AS RESTRICTIVE
FOR INSERT TO authenticated WITH CHECK (
  source_type = 'user' AND EXISTS (SELECT 1 FROM public.tavvy_places tp
    WHERE tp.id::text = places.source_id AND tp.created_by = auth.uid())
);
DROP POLICY IF EXISTS canonical_owner_update ON public.places;
CREATE POLICY canonical_owner_update ON public.places AS RESTRICTIVE
FOR UPDATE TO authenticated USING (
  (source_type = 'user' AND EXISTS (SELECT 1 FROM public.tavvy_places tp
    WHERE tp.id::text = places.source_id AND tp.created_by = auth.uid()))
  OR EXISTS (SELECT 1 FROM public.pro_business_claims bc
    WHERE bc.place_id = places.id AND bc.user_id = auth.uid() AND bc.status = 'verified')
) WITH CHECK (
  (source_type = 'user' AND EXISTS (SELECT 1 FROM public.tavvy_places tp
    WHERE tp.id::text = places.source_id AND tp.created_by = auth.uid()))
  OR EXISTS (SELECT 1 FROM public.pro_business_claims bc
    WHERE bc.place_id = places.id AND bc.user_id = auth.uid() AND bc.status = 'verified')
);

-- A contributor may manage only memberships for their own authored contribution
-- in its recorded universe. Universe-wide administration remains backend-only.
DROP POLICY IF EXISTS universe_membership_author_insert ON public.atlas_universe_places;
CREATE POLICY universe_membership_author_insert ON public.atlas_universe_places AS RESTRICTIVE
FOR INSERT TO authenticated WITH CHECK (EXISTS (
  SELECT 1 FROM public.places p JOIN public.tavvy_places tp ON p.source_id = tp.id::text
  WHERE p.id = atlas_universe_places.place_id AND p.source_type = 'user'
    AND tp.created_by = auth.uid() AND tp.universe_id = atlas_universe_places.universe_id
));
DROP POLICY IF EXISTS universe_membership_author_update ON public.atlas_universe_places;
CREATE POLICY universe_membership_author_update ON public.atlas_universe_places AS RESTRICTIVE
FOR UPDATE TO authenticated USING (EXISTS (
  SELECT 1 FROM public.places p JOIN public.tavvy_places tp ON p.source_id = tp.id::text
  WHERE p.id = atlas_universe_places.place_id AND p.source_type = 'user'
    AND tp.created_by = auth.uid() AND tp.universe_id = atlas_universe_places.universe_id
)) WITH CHECK (EXISTS (
  SELECT 1 FROM public.places p JOIN public.tavvy_places tp ON p.source_id = tp.id::text
  WHERE p.id = atlas_universe_places.place_id AND p.source_type = 'user'
    AND tp.created_by = auth.uid() AND tp.universe_id = atlas_universe_places.universe_id
));
DROP POLICY IF EXISTS universe_membership_author_delete ON public.atlas_universe_places;
CREATE POLICY universe_membership_author_delete ON public.atlas_universe_places AS RESTRICTIVE
FOR DELETE TO authenticated USING (EXISTS (
  SELECT 1 FROM public.places p JOIN public.tavvy_places tp ON p.source_id = tp.id::text
  WHERE p.id = atlas_universe_places.place_id AND p.source_type = 'user'
    AND tp.created_by = auth.uid() AND tp.universe_id = atlas_universe_places.universe_id
));
COMMIT;
