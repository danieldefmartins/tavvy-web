-- Independent gallery visibility; existing menus keep their gallery and legacy Visual design.
-- Requires verified restaurant menu ownership policies from 202609210001.
BEGIN;
ALTER TABLE public.menus ADD COLUMN IF NOT EXISTS photo_gallery_enabled boolean NOT NULL DEFAULT true;
COMMENT ON COLUMN public.menus.photo_gallery_enabled IS 'Show the separate customer photo gallery, independently of menus.style. Does not delete images.';
COMMENT ON COLUMN public.menus.style IS 'Customer menu design: elegant_ivory, clean_white, visual. Legacy magazine/gallery values render as Visual.';
COMMIT;
