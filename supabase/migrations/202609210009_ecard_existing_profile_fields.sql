-- Persist fields already offered by the eCard editors/public renderers.
-- Nullable, without a backfill: existing content and designs remain unchanged.
ALTER TABLE public.digital_cards
  ADD COLUMN IF NOT EXISTS pronouns text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS business_type text;

COMMENT ON COLUMN public.digital_cards.pronouns IS 'Optional pronouns entered in the existing eCard profile editor.';
COMMENT ON COLUMN public.digital_cards.description IS 'Business specialties/description entered in the existing mobile-business editor.';
COMMENT ON COLUMN public.digital_cards.business_type IS 'Business type entered in the existing mobile-business editor.';
NOTIFY pgrst,'reload schema';
