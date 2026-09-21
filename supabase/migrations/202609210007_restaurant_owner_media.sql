-- Verified restaurant media management. Depends on owner001 and story002/004.
-- Preserve authenticated customer photo publishing; merchant actions never target guest assets.
ALTER TABLE public.place_photos ADD COLUMN IF NOT EXISTS media_path text;
ALTER TABLE public.place_photos ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.owns_uploaded_place_photo(p_url text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT auth.uid() IS NOT NULL AND EXISTS(
  SELECT 1 FROM storage.objects o, public.story_publish_settings cfg
  WHERE cfg.singleton AND o.bucket_id='place-photos'
    AND p_url=cfg.public_storage_origin||'/storage/v1/object/public/place-photos/'||o.name
    AND o.name=substring(p_url FROM length(cfg.public_storage_origin||'/storage/v1/object/public/place-photos/')+1)
    AND coalesce(nullif(o.owner_id,''),o.owner::text)=auth.uid()::text
    AND nullif(to_jsonb(o)->>'archived_at','') IS NULL
    AND NOT coalesce((to_jsonb(o)->>'is_delete_marker')::boolean,false)
 )
$$;
REVOKE ALL ON FUNCTION public.owns_uploaded_place_photo(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.owns_uploaded_place_photo(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.guard_place_photo_submission()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE prefix text; actor uuid:=auth.uid();
BEGIN
 IF auth.role()='authenticated' THEN
  IF actor IS NULL OR coalesce(NEW.user_id,NEW.uploaded_by) IS DISTINCT FROM actor
    OR (NEW.user_id IS NOT NULL AND NEW.user_id<>actor)
    OR (NEW.uploaded_by IS NOT NULL AND NEW.uploaded_by<>actor) THEN RAISE EXCEPTION 'PHOTO_AUTHOR_REQUIRED'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.places WHERE id=NEW.place_id AND is_active IS DISTINCT FROM false AND coalesce(status,'active')='active')
    THEN RAISE EXCEPTION 'PHOTO_PLACE_UNAVAILABLE'; END IF;
  IF NOT public.owns_uploaded_place_photo(NEW.url) THEN RAISE EXCEPTION 'PHOTO_ASSET_NOT_OWNED'; END IF;
  IF NEW.is_owner_photo AND NOT public.has_verified_restaurant_claim(NEW.place_id) THEN RAISE EXCEPTION 'PHOTO_OWNER_REQUIRED'; END IF;
  IF NEW.status<>'live' OR coalesce(NEW.is_verified,false) OR coalesce(NEW.is_cover,false)
    OR coalesce(NEW.likes_count,0)<>0 OR coalesce(NEW.flagged_count,0)<>0 OR coalesce(NEW.is_flagged,false) OR NEW.removed_at IS NOT NULL OR NEW.removed_by IS NOT NULL
    THEN RAISE EXCEPTION 'PHOTO_METADATA_INVALID'; END IF;
  SELECT public_storage_origin||'/storage/v1/object/public/place-photos/' INTO prefix FROM public.story_publish_settings WHERE singleton;
  NEW.media_path:=substring(NEW.url FROM length(prefix)+1);
  NEW.created_at:=now();
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS place_photo_submission_guard ON public.place_photos;
CREATE TRIGGER place_photo_submission_guard BEFORE INSERT ON public.place_photos FOR EACH ROW EXECUTE FUNCTION public.guard_place_photo_submission();

-- Existing permissive INSERT true and SELECT true policies cannot override these.
CREATE POLICY place_photo_author_insert_guard ON public.place_photos AS RESTRICTIVE FOR INSERT TO PUBLIC WITH CHECK(
 auth.uid() IS NOT NULL AND coalesce(user_id,uploaded_by)=auth.uid()
 AND (user_id IS NULL OR user_id=auth.uid()) AND (uploaded_by IS NULL OR uploaded_by=auth.uid()));
CREATE POLICY place_photo_visibility_guard ON public.place_photos AS RESTRICTIVE FOR SELECT TO PUBLIC USING(
 status='live' OR auth.uid()=coalesce(user_id,uploaded_by));
CREATE POLICY place_photo_author_update_guard ON public.place_photos AS RESTRICTIVE FOR UPDATE TO PUBLIC USING(
 auth.uid() IS NOT NULL AND coalesce(user_id,uploaded_by)=auth.uid()
 AND (user_id IS NULL OR user_id=auth.uid()) AND (uploaded_by IS NULL OR uploaded_by=auth.uid())) WITH CHECK(
 auth.uid() IS NOT NULL AND coalesce(user_id,uploaded_by)=auth.uid()
 AND (user_id IS NULL OR user_id=auth.uid()) AND (uploaded_by IS NULL OR uploaded_by=auth.uid()));
CREATE POLICY place_photo_author_delete_guard ON public.place_photos AS RESTRICTIVE FOR DELETE TO PUBLIC USING(
 auth.uid() IS NOT NULL AND coalesce(user_id,uploaded_by)=auth.uid()
 AND (user_id IS NULL OR user_id=auth.uid()) AND (uploaded_by IS NULL OR uploaded_by=auth.uid()));

-- Older clients use different folder shapes; Storage's actual owner is authoritative.
CREATE POLICY place_photo_asset_delete_guard ON storage.objects AS RESTRICTIVE FOR DELETE TO authenticated USING(
 bucket_id<>'place-photos' OR coalesce(nullif(owner_id,''),owner::text)=auth.uid()::text);
CREATE POLICY place_photo_asset_owner_delete ON storage.objects FOR DELETE TO authenticated USING(
 bucket_id='place-photos' AND coalesce(nullif(owner_id,''),owner::text)=auth.uid()::text);
CREATE POLICY place_photo_asset_update_guard ON storage.objects AS RESTRICTIVE FOR UPDATE TO authenticated USING(bucket_id<>'place-photos') WITH CHECK(bucket_id<>'place-photos');

CREATE TABLE public.restaurant_owner_photo_uploads(
 media_path text PRIMARY KEY,photo_id uuid NOT NULL UNIQUE REFERENCES public.place_photos(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,place_id uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.restaurant_owner_photo_uploads ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.restaurant_owner_photo_uploads FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.restaurant_owner_photo_uploads TO service_role;

CREATE OR REPLACE FUNCTION public.get_my_restaurant_photo_upload(p_media_path text)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT jsonb_build_object('id',p.id,'place_id',p.place_id,'url',p.url,'caption',p.caption,'media_path',u.media_path,'status',p.status)
 FROM public.restaurant_owner_photo_uploads u JOIN public.place_photos p ON p.id=u.photo_id
 WHERE u.media_path=p_media_path AND u.user_id=auth.uid()
$$;
CREATE OR REPLACE FUNCTION public.publish_restaurant_owner_photo(p_place_id uuid,p_media_path text,p_caption text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE actor uuid:=auth.uid(); result public.place_photos%ROWTYPE; existing jsonb; asset storage.objects%ROWTYPE; origin text; mime text; bytes bigint;
BEGIN
 IF actor IS NULL THEN RAISE EXCEPTION 'PHOTO_AUTH_REQUIRED'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('owner-photo:'||actor::text,0));
 existing:=public.get_my_restaurant_photo_upload(p_media_path);
 IF existing IS NOT NULL THEN
  IF existing->>'status'<>'live' OR existing->>'place_id'<>p_place_id::text
    OR coalesce(existing->>'caption','')<>coalesce(nullif(btrim(p_caption),''),'') THEN RAISE EXCEPTION 'PHOTO_RETRY_MISMATCH'; END IF;
  RETURN existing;
 END IF;
 IF NOT public.has_verified_restaurant_claim(p_place_id) THEN RAISE EXCEPTION 'PHOTO_OWNER_REQUIRED'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.places WHERE id=p_place_id AND is_active IS DISTINCT FROM false AND coalesce(status,'active')='active')
   THEN RAISE EXCEPTION 'PHOTO_PLACE_UNAVAILABLE'; END IF;
 IF EXISTS(SELECT 1 FROM auth.users u WHERE u.id=actor AND nullif(to_jsonb(u)->>'banned_until','')::timestamptz>now())
   THEN RAISE EXCEPTION 'PHOTO_ACCOUNT_RESTRICTED'; END IF;
 IF length(coalesce(p_caption,''))>500 THEN RAISE EXCEPTION 'PHOTO_CAPTION_TOO_LONG'; END IF;
 IF p_media_path IS NULL OR p_media_path NOT LIKE actor::text||'/'||p_place_id::text||'/%'
   OR p_media_path !~ '^[a-f0-9-]+/[a-f0-9-]+/[A-Za-z0-9._-]+$' OR p_media_path LIKE '%..%'
   THEN RAISE EXCEPTION 'PHOTO_ASSET_NOT_OWNED'; END IF;
 SELECT * INTO asset FROM storage.objects WHERE bucket_id='place-photos' AND name=p_media_path
   AND coalesce(nullif(owner_id,''),owner::text)=actor::text;
 IF NOT FOUND THEN RAISE EXCEPTION 'PHOTO_ASSET_NOT_OWNED'; END IF;
 IF coalesce(asset.metadata->>'size','') !~ '^[0-9]+$' THEN RAISE EXCEPTION 'PHOTO_UPLOAD_INCOMPLETE'; END IF;
 bytes:=(asset.metadata->>'size')::bigint;mime:=asset.metadata->>'mimetype';
 IF bytes<1 OR bytes>10485760 THEN RAISE EXCEPTION 'PHOTO_TOO_LARGE'; END IF;
 IF mime IS NULL OR mime NOT IN ('image/jpeg','image/png','image/webp','image/heic') THEN RAISE EXCEPTION 'PHOTO_TYPE_INVALID'; END IF;
 SELECT public_storage_origin INTO STRICT origin FROM public.story_publish_settings WHERE singleton;
 INSERT INTO public.place_photos(place_id,user_id,uploaded_by,url,media_path,caption,is_owner_photo,status)
 VALUES(p_place_id,actor,CASE WHEN EXISTS(SELECT 1 FROM public.users WHERE id=actor) THEN actor ELSE NULL END,
   origin||'/storage/v1/object/public/place-photos/'||p_media_path,p_media_path,nullif(btrim(p_caption),''),true,'live') RETURNING * INTO result;
 INSERT INTO public.restaurant_owner_photo_uploads(media_path,photo_id,user_id,place_id) VALUES(p_media_path,result.id,actor,p_place_id);
 RETURN public.get_my_restaurant_photo_upload(p_media_path);
END $$;

CREATE OR REPLACE FUNCTION public.set_restaurant_owner_cover(p_place_id uuid,p_photo_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE photo public.place_photos%ROWTYPE;
BEGIN
 IF NOT public.has_verified_restaurant_claim(p_place_id) THEN RAISE EXCEPTION 'PHOTO_OWNER_REQUIRED'; END IF;
 SELECT * INTO photo FROM public.place_photos WHERE id=p_photo_id AND place_id=p_place_id AND status='live'
   AND coalesce(user_id,uploaded_by)=auth.uid() AND (user_id IS NULL OR user_id=auth.uid()) AND (uploaded_by IS NULL OR uploaded_by=auth.uid());
 IF NOT FOUND OR NOT public.owns_uploaded_place_photo(photo.url) THEN RAISE EXCEPTION 'PHOTO_AUTHOR_REQUIRED'; END IF;
 UPDATE public.places SET cover_image_url=photo.url WHERE id=p_place_id AND is_active IS DISTINCT FROM false AND coalesce(status,'active')='active';
 IF NOT FOUND THEN RAISE EXCEPTION 'PHOTO_PLACE_UNAVAILABLE'; END IF;
 RETURN photo.url;
END $$;
CREATE OR REPLACE FUNCTION public.remove_restaurant_owner_photo(p_place_id uuid,p_photo_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE photo public.place_photos%ROWTYPE;prefix text;
BEGIN
 IF NOT public.has_verified_restaurant_claim(p_place_id) THEN RAISE EXCEPTION 'PHOTO_OWNER_REQUIRED'; END IF;
 SELECT * INTO photo FROM public.place_photos WHERE id=p_photo_id AND place_id=p_place_id
   AND coalesce(user_id,uploaded_by)=auth.uid() AND (user_id IS NULL OR user_id=auth.uid()) AND (uploaded_by IS NULL OR uploaded_by=auth.uid()) FOR UPDATE;
 IF NOT FOUND OR NOT public.owns_uploaded_place_photo(photo.url) THEN RAISE EXCEPTION 'PHOTO_AUTHOR_REQUIRED'; END IF;
 UPDATE public.place_photos SET status='removed',removed_at=now(),removed_reason='Removed by original uploader',
   removed_by=CASE WHEN EXISTS(SELECT 1 FROM public.users WHERE id=auth.uid()) THEN auth.uid() ELSE NULL END WHERE id=photo.id;
 UPDATE public.places SET cover_image_url=NULL WHERE id=p_place_id AND cover_image_url=photo.url;
 SELECT public_storage_origin||'/storage/v1/object/public/place-photos/' INTO prefix FROM public.story_publish_settings WHERE singleton;
 RETURN jsonb_build_object('id',photo.id,'media_path',substring(photo.url FROM length(prefix)+1));
END $$;

CREATE OR REPLACE FUNCTION public.get_restaurant_owner_media(p_place_id uuid,p_offset integer DEFAULT 0,p_limit integer DEFAULT 24)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE place public.places%ROWTYPE; photos jsonb;stories jsonb;highlights jsonb; total_photos integer;total_stories integer;total_highlights integer;
  take integer:=greatest(1,least(coalesce(p_limit,24),48));skip integer:=greatest(0,coalesce(p_offset,0));prefix text;
BEGIN
 IF NOT public.has_verified_restaurant_claim(p_place_id) THEN RAISE EXCEPTION 'PHOTO_OWNER_REQUIRED'; END IF;
 SELECT * INTO place FROM public.places WHERE id=p_place_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'PHOTO_PLACE_UNAVAILABLE'; END IF;
 SELECT public_storage_origin||'/storage/v1/object/public/place-photos/' INTO prefix FROM public.story_publish_settings WHERE singleton;
 WITH mine AS (
  SELECT p.id,p.url,p.caption,p.created_at,p.is_owner_photo,substring(p.url FROM length(prefix)+1) media_path FROM public.place_photos p
  WHERE p.place_id=p_place_id AND p.status='live' AND coalesce(p.user_id,p.uploaded_by)=auth.uid()
    AND (p.user_id IS NULL OR p.user_id=auth.uid()) AND (p.uploaded_by IS NULL OR p.uploaded_by=auth.uid())
    AND public.owns_uploaded_place_photo(p.url)
 ) SELECT (SELECT count(*) FROM mine),coalesce((SELECT jsonb_agg(to_jsonb(a)) FROM(SELECT * FROM mine ORDER BY created_at DESC,id DESC LIMIT take OFFSET skip)a),'[]') INTO total_photos,photos;
 SELECT count(*) INTO total_stories FROM public.place_stories WHERE place_id=p_place_id AND user_id=auth.uid() AND status='active';
 SELECT coalesce(jsonb_agg(to_jsonb(a)),'[]') INTO stories FROM(
  SELECT id,media_url,media_path,media_type,caption,story_kind,created_at,expires_at,is_permanent
  FROM public.place_stories WHERE place_id=p_place_id AND user_id=auth.uid() AND status='active' ORDER BY created_at DESC,id DESC LIMIT take OFFSET skip)a;
 SELECT count(*) INTO total_highlights FROM public.place_story_highlights WHERE place_id=p_place_id;
 SELECT coalesce(jsonb_agg(to_jsonb(a)),'[]') INTO highlights FROM(
  SELECT h.id,h.title,h.is_active,h.position,coalesce((SELECT jsonb_agg(jsonb_build_object('id',s.id,'media_url',s.media_url,'media_type',s.media_type,'caption',s.caption,'story_kind',s.story_kind) ORDER BY i.position)
    FROM public.place_story_highlight_items i JOIN public.place_stories s ON s.id=i.story_id
    WHERE i.highlight_id=h.id AND s.status='active' AND s.story_kind='owner_highlight'),'[]') stories
  FROM public.place_story_highlights h WHERE h.place_id=p_place_id ORDER BY h.position,h.id LIMIT take OFFSET skip)a;
 RETURN jsonb_build_object('place',jsonb_build_object('id',place.id,'name',place.name,'cover_image_url',place.cover_image_url),
  'photos',photos,'stories',stories,'highlights',highlights,'totals',jsonb_build_object('photos',total_photos,'stories',total_stories,'highlights',total_highlights),
  'nextOffset',skip+take,'hasMore',greatest(total_photos,total_stories,total_highlights)>skip+take,'maxPhotoBytes',10485760);
END $$;
DO $$ DECLARE f record; BEGIN
 FOR f IN SELECT p.oid::regprocedure signature FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.proname IN ('get_my_restaurant_photo_upload','publish_restaurant_owner_photo','set_restaurant_owner_cover','remove_restaurant_owner_photo','get_restaurant_owner_media') LOOP
  EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon',f.signature);
  EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated',f.signature);
 END LOOP;
END $$;
NOTIFY pgrst,'reload schema';
