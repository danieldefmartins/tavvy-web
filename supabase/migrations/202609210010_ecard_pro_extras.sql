-- Approved Pro extras. Never rewrites, removes, or unpublishes existing content.
-- Drafts can retain their content; the rule is enforced when content goes public.
create or replace function public.ecard_extra_json(value jsonb)
returns jsonb language plpgsql immutable set search_path=pg_catalog,public as $$
declare decoded jsonb; i integer;
begin
 for i in 1..12 loop
  if jsonb_typeof(value) is distinct from 'string' then return value; end if;
  begin decoded:=(value #>> '{}')::jsonb;
  exception when invalid_text_representation then return value; end;
  if decoded=value then return value; end if;
  value:=decoded;
 end loop;
 return value;
end $$;

create or replace function public.ecard_extra_has_content(value jsonb)
returns boolean language plpgsql immutable set search_path=pg_catalog,public as $$
declare item jsonb; field text;
begin
 value:=public.ecard_extra_json(value);
 if jsonb_typeof(value)='object' and (value->'enabled'='false'::jsonb or value->'is_active'='false'::jsonb or value->'visible'='false'::jsonb) then return false; end if;
 case jsonb_typeof(value)
  when 'string' then return length(btrim(value #>> '{}'))>0;
  when 'boolean' then return value='true'::jsonb;
  when 'number' then return (value #>> '{}')::numeric>0;
  when 'array' then
   for item in select x.val from jsonb_array_elements(value) as x(val) loop
    if public.ecard_extra_has_content(item) then return true; end if;
   end loop;
  when 'object' then
   for field,item in select x.k,x.v from jsonb_each(value) as x(k,v) loop
    if field=any(array['id','type','enabled','is_active','visible','sort_order','created_at','updated_at']) then continue; end if;
    -- Text entered into a credential field (including "0") is not a numeric default.
    if jsonb_typeof(item)='string' then
     if length(btrim(item #>> '{}'))>0 then return true; end if;
    elsif public.ecard_extra_has_content(item) then return true; end if;
   end loop;
  else return false;
 end case;
 return false;
end $$;

create or replace function public.ecard_pro_extra_facts(card jsonb)
returns jsonb language plpgsql immutable set search_path=pg_catalog,public as $$
declare media jsonb:='[]'; items jsonb; item jsonb; field text; location text; media_key text;
 form_value jsonb:=public.ecard_extra_json(card->'form_block');
 has_form boolean; has_credentials boolean;
begin
 foreach field in array array['gallery_images','videos'] loop
  items:=public.ecard_extra_json(card->field);
  if jsonb_typeof(items)='array' then
   for item in select x.val from jsonb_array_elements(items) as x(val) loop
    -- Match old URI-only media too. Captions, ordering and other metadata can
    -- change without replacing an existing owner's media with a new URL.
    location:=null;
    if jsonb_typeof(item)='string' then location:=nullif(btrim(item #>> '{}'),'');
    elsif jsonb_typeof(item)='object' then
     foreach media_key in array case when field='gallery_images' then array['url','uri'] else array['url','uri','videoId','video_id'] end loop
      if jsonb_typeof(item->media_key)='string' then location:=nullif(btrim(item->>media_key),''); end if;
      exit when location is not null;
     end loop;
    end if;
    if location is not null then media:=media || jsonb_build_array(field||':'||location); end if;
   end loop;
  end if;
 end loop;
 foreach field in array array['youtube_video_id','youtube_video_url'] loop
  location:=btrim(coalesce(card->>field,''));
  if location<>'' then media:=media || jsonb_build_array(field||':'||location); end if;
 end loop;
 has_form:=coalesce(form_value='true'::jsonb or
   (jsonb_typeof(form_value)='object' and form_value->'enabled' is distinct from 'false'::jsonb),false);
 has_credentials:=public.ecard_extra_has_content(card->'pro_credentials');
 return jsonb_build_object('media',media,'form',has_form,'credentials',has_credentials,
   'has_extras',jsonb_array_length(media)>0 or has_form or has_credentials);
end $$;

create or replace function public.enforce_ecard_pro_extras()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare next_facts jsonb; previous_facts jsonb; publication boolean; needs_pro boolean;
begin
 if auth.uid() is null or new.is_published is not true then return new; end if;
 next_facts:=public.ecard_pro_extra_facts(to_jsonb(new));
 if not (next_facts->>'has_extras')::boolean then return new; end if;
 if tg_op='INSERT' then
  publication:=true;
  previous_facts:=public.ecard_pro_extra_facts('{}');
 else
  publication:=old.is_published is not true;
  previous_facts:=public.ecard_pro_extra_facts(to_jsonb(old));
 end if;
 needs_pro:=publication
   or not ((previous_facts->'media') @> (next_facts->'media'))
   or ((next_facts->>'form')::boolean and not (previous_facts->>'form')::boolean)
   or ((next_facts->>'credentials')::boolean and not (previous_facts->>'credentials')::boolean);
 if needs_pro and not coalesce((public.get_my_ecard_entitlement()->>'is_pro')::boolean,false) then
  raise exception 'An active Pro plan is required to publish or add galleries, embedded videos, contact forms, or professional credentials.' using errcode='42501';
 end if;
 return new;
end $$;

revoke all on function public.ecard_extra_json(jsonb) from public,anon,authenticated;
revoke all on function public.ecard_extra_has_content(jsonb) from public,anon,authenticated;
revoke all on function public.ecard_pro_extra_facts(jsonb) from public,anon,authenticated;
revoke all on function public.enforce_ecard_pro_extras() from public,anon,authenticated;
drop trigger if exists ecard_pro_extras_guard on public.digital_cards;
create trigger ecard_pro_extras_guard before insert or update on public.digital_cards
for each row execute function public.enforce_ecard_pro_extras();
