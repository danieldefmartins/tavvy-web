-- Requires 202609210001_restaurant_owner_onboarding.sql.
-- Order creation and lifecycle mutations are atomic, server-authorized operations.
begin;
create table if not exists public.place_ordering_settings (
 place_id uuid primary key references public.places(id) on delete cascade,
 enabled boolean not null default false,
 tax_basis_points numeric(10,4) check (tax_basis_points between 0 and 10000),
 updated_at timestamptz not null default now(), updated_by uuid
);
alter table public.orders add column if not exists order_number text;
alter table public.orders add column if not exists idempotency_key uuid;
alter table public.orders add column if not exists request_hash text;
update public.orders set order_number=upper(substr(replace(id::text,'-',''),1,10)) where order_number is null;
create unique index if not exists orders_customer_idempotency on public.orders(customer_id,idempotency_key) where idempotency_key is not null;
alter table public.place_ordering_settings enable row level security;
alter table public.restaurant_tables enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
-- Replace audited permissive policies, including any legacy equivalents.
do $$ declare p record; begin
 for p in select tablename,policyname from pg_policies where schemaname='public' and tablename in ('orders','order_items','restaurant_tables','place_ordering_settings') loop
  execute format('drop policy %I on public.%I',p.policyname,p.tablename);
 end loop;
end $$;
revoke all on public.orders,public.order_items,public.restaurant_tables,public.place_ordering_settings from public,anon,authenticated;
grant select on public.orders,public.order_items,public.restaurant_tables,public.place_ordering_settings to authenticated;
create policy orders_scoped_read on public.orders for select to authenticated using(customer_id=auth.uid() or public.has_verified_restaurant_claim(place_id));
create policy order_items_scoped_read on public.order_items for select to authenticated using(exists(select 1 from public.orders o where o.id=order_items.order_id and (o.customer_id=auth.uid() or public.has_verified_restaurant_claim(o.place_id))));
create policy ordering_settings_owner_read on public.place_ordering_settings for select to authenticated using(public.has_verified_restaurant_claim(place_id));
create policy ordering_tables_owner_read on public.restaurant_tables for select to authenticated using(public.has_verified_restaurant_claim(place_id));

create or replace function public.get_place_ordering_context(p_place_id uuid,p_table_number text default null) returns jsonb
language plpgsql stable security definer set search_path=public,pg_temp as $$
declare s public.place_ordering_settings; valid_place boolean; valid_menu boolean; valid_table boolean;
begin
 select * into s from public.place_ordering_settings where place_id=p_place_id;
 select exists(select 1 from public.places where id=p_place_id and status='active') into valid_place;
 select exists(select 1 from public.menus where place_id=p_place_id and is_active=true) into valid_menu;
 select exists(select 1 from public.restaurant_tables where place_id=p_place_id and table_number=btrim(p_table_number) and is_active=true) into valid_table;
 return jsonb_build_object('enabled',coalesce(s.enabled,false),'configured',s.tax_basis_points is not null,'taxBasisPoints',s.tax_basis_points,
  'ready',valid_place and valid_menu and coalesce(s.enabled,false) and s.tax_basis_points is not null and exists(select 1 from public.restaurant_tables where place_id=p_place_id and is_active=true),
  'tableValid',valid_table,'tableNumber',nullif(btrim(p_table_number),''));
end $$;

create or replace function public.configure_place_ordering(p_place_id uuid,p_enabled boolean,p_tax_basis_points numeric) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if auth.uid() is null or not public.has_verified_restaurant_claim(p_place_id) then raise exception 'Verified restaurant ownership is required' using errcode='42501'; end if;
 if p_tax_basis_points is null or p_tax_basis_points<0 or p_tax_basis_points>10000 or p_enabled is null then raise exception 'Enter the restaurant tax rate explicitly'; end if;
 if p_enabled and (not exists(select 1 from public.menus where place_id=p_place_id and is_active=true)
  or not exists(select 1 from public.restaurant_tables where place_id=p_place_id and is_active=true)) then raise exception 'Publish an active menu and add an active table before enabling orders'; end if;
 insert into public.place_ordering_settings(place_id,enabled,tax_basis_points,updated_by) values(p_place_id,p_enabled,p_tax_basis_points,auth.uid())
 on conflict(place_id) do update set enabled=excluded.enabled,tax_basis_points=excluded.tax_basis_points,updated_by=excluded.updated_by,updated_at=now();
 update public.places set ordering_enabled=p_enabled where id=p_place_id;
 return public.get_place_ordering_context(p_place_id);
end $$;

create or replace function public.set_ordering_table(p_place_id uuid,p_table_number text,p_active boolean) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare t public.restaurant_tables;
begin
 if auth.uid() is null or not public.has_verified_restaurant_claim(p_place_id) then raise exception 'Verified restaurant ownership is required' using errcode='42501'; end if;
 if nullif(btrim(p_table_number),'') is null or length(btrim(p_table_number))>32 or p_active is null then raise exception 'Enter a table number up to 32 characters'; end if;
 insert into public.restaurant_tables(place_id,table_number,is_active) values(p_place_id,btrim(p_table_number),p_active)
 on conflict(place_id,table_number) do update set is_active=excluded.is_active returning * into t;
 return jsonb_build_object('id',t.id,'table_number',t.table_number,'is_active',t.is_active);
end $$;

create or replace function public.submit_place_order(p_place_id uuid,p_table_number text,p_items jsonb,p_notes text,p_customer_name text,p_idempotency_key uuid,p_expected_total numeric) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare actor uuid:=auth.uid(); s public.place_ordering_settings; t public.restaurant_tables; o public.orders; item jsonb; mi record;
 total_qty integer:=0; qty integer; subtotal_value numeric:=0; tax_value numeric; total_value numeric; payload_hash text; seen uuid[]:='{}'; menu_item uuid; lines jsonb:='[]'::jsonb;
begin
 if actor is null then raise exception 'Sign in to place an order' using errcode='42501'; end if;
 if p_idempotency_key is null then raise exception 'An order request identifier is required'; end if;
 if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) not between 1 and 30 then raise exception 'Choose between 1 and 30 menu items'; end if;
 if length(coalesce(p_notes,''))>1000 or length(coalesce(p_customer_name,''))>80 then raise exception 'Order notes or name are too long'; end if;
 if p_expected_total is null or p_expected_total<0 or p_expected_total>100000 then raise exception 'Invalid expected order total'; end if;
 payload_hash:=md5(jsonb_build_object('place',p_place_id,'table',btrim(p_table_number),'items',p_items,'notes',coalesce(p_notes,''),'name',coalesce(p_customer_name,''),'total',p_expected_total)::text);
 perform pg_advisory_xact_lock(hashtextextended(actor::text||p_idempotency_key::text,0));
 select * into o from public.orders where customer_id=actor and idempotency_key=p_idempotency_key;
 if found then
  if o.request_hash is distinct from payload_hash then raise exception 'This request identifier belongs to a different order'; end if;
  return to_jsonb(o)||jsonb_build_object('items',(select coalesce(jsonb_agg(to_jsonb(i)),'[]') from public.order_items i where i.order_id=o.id));
 end if;
 select * into s from public.place_ordering_settings where place_id=p_place_id for share;
 if not found or not s.enabled or s.tax_basis_points is null then raise exception 'Ordering is not available. Please ask the restaurant.'; end if;
 if not exists(select 1 from public.places where id=p_place_id and status='active') then raise exception 'This restaurant is not accepting orders'; end if;
 select * into t from public.restaurant_tables where place_id=p_place_id and table_number=btrim(p_table_number) and is_active=true for share;
 if not found then raise exception 'Scan an active table QR code or confirm your table number with the restaurant'; end if;
 -- Lock referenced menu records while prices and availability are snapshotted.
 for item in select value from jsonb_array_elements(p_items) loop
  if jsonb_typeof(item) is distinct from 'object' or jsonb_typeof(item->'quantity') is distinct from 'number' or coalesce(item->>'quantity','') !~ '^[0-9]{1,2}$' then raise exception 'Invalid order quantity'; end if;
  qty:=(item->>'quantity')::int;
  if qty<1 or qty>20 or length(coalesce(item->>'notes',''))>500 then raise exception 'Use 1–20 per item and notes up to 500 characters'; end if;
  menu_item:=(item->>'menu_item_id')::uuid;
  if menu_item=any(seen) then raise exception 'Combine duplicate items before submitting'; end if;
  seen:=array_append(seen,menu_item);total_qty:=total_qty+qty;
  if total_qty>100 then raise exception 'Orders are limited to 100 items'; end if;
  select i.id,i.name,i.price into mi from public.menu_items i join public.menu_categories c on c.id=i.category_id join public.menus m on m.id=c.menu_id
   where i.id=menu_item and m.place_id=p_place_id and m.is_active=true and i.is_available=true and i.price is not null and i.price>=0 and i.price<=10000
   and (i.place_id is null or i.place_id=p_place_id) for share of i,c,m;
  if not found then raise exception 'A selected dish is unavailable or does not belong to this restaurant'; end if;
  subtotal_value:=subtotal_value+round(mi.price,2)*qty;
  lines:=lines||jsonb_build_array(jsonb_build_object('menu_item_id',mi.id,'name',mi.name,'price',round(mi.price,2),'quantity',qty,'notes',nullif(item->>'notes','')));
 end loop;
 tax_value:=round(subtotal_value*s.tax_basis_points/10000,2); total_value:=subtotal_value+tax_value;
 if total_value is distinct from round(p_expected_total,2) then raise exception 'MENU_CHANGED: The menu or tax changed. Refresh and review your total before ordering.'; end if;
 insert into public.orders(place_id,table_id,table_number,customer_id,customer_name,status,subtotal,tax,total,notes,idempotency_key,request_hash,order_number)
 values(p_place_id,t.id,t.table_number,actor,nullif(btrim(p_customer_name),''),'pending',subtotal_value,tax_value,total_value,nullif(p_notes,''),p_idempotency_key,payload_hash,upper(substr(replace(gen_random_uuid()::text,'-',''),1,10))) returning * into o;
 insert into public.order_items(order_id,menu_item_id,name,price,quantity,notes,status)
 select o.id,(v->>'menu_item_id')::uuid,v->>'name',(v->>'price')::numeric,(v->>'quantity')::integer,v->>'notes','pending' from jsonb_array_elements(lines) v;
 return to_jsonb(o)||jsonb_build_object('items',(select coalesce(jsonb_agg(to_jsonb(i)),'[]') from public.order_items i where i.order_id=o.id));
end $$;

create or replace function public.transition_place_order(p_order_id uuid,p_expected_status text,p_next_status text,p_reason text default null) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare o public.orders;
begin
 select * into o from public.orders where id=p_order_id for update;
 if not found or auth.uid() is null or not public.has_verified_restaurant_claim(o.place_id) then raise exception 'Restaurant order access is required' using errcode='42501'; end if;
 if o.status is distinct from p_expected_status then raise exception 'The order status changed. Refresh before trying again.'; end if;
 if p_next_status is null or not ((o.status='pending' and p_next_status='confirmed') or (o.status='confirmed' and p_next_status='preparing') or (o.status='preparing' and p_next_status='ready') or (o.status='ready' and p_next_status='served') or (o.status in ('pending','confirmed','preparing','ready') and p_next_status='cancelled')) then raise exception 'This order status transition is not allowed'; end if;
 if p_next_status='cancelled' and (nullif(btrim(p_reason),'') is null or length(p_reason)>500) then raise exception 'A cancellation reason up to 500 characters is required'; end if;
 update public.orders set status=p_next_status,updated_at=now(),confirmed_at=case when p_next_status='confirmed' then now() else confirmed_at end,
  confirmed_by=case when p_next_status='confirmed' then auth.uid()::text else confirmed_by end,
  prepared_at=case when p_next_status='ready' then now() else prepared_at end,served_at=case when p_next_status='served' then now() else served_at end,
  cancelled_at=case when p_next_status='cancelled' then now() else cancelled_at end,cancel_reason=case when p_next_status='cancelled' then p_reason else cancel_reason end
 where id=p_order_id returning * into o;
 update public.order_items set status=p_next_status where order_id=p_order_id;
 return to_jsonb(o)||jsonb_build_object('items',(select coalesce(jsonb_agg(to_jsonb(i)),'[]') from public.order_items i where i.order_id=o.id));
end $$;
revoke all on function public.get_place_ordering_context(uuid,text),public.configure_place_ordering(uuid,boolean,numeric),public.set_ordering_table(uuid,text,boolean),public.submit_place_order(uuid,text,jsonb,text,text,uuid,numeric),public.transition_place_order(uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.get_place_ordering_context(uuid,text) to anon,authenticated;
grant execute on function public.configure_place_ordering(uuid,boolean,numeric),public.set_ordering_table(uuid,text,boolean),public.submit_place_order(uuid,text,jsonb,text,text,uuid,numeric),public.transition_place_order(uuid,text,text,text) to authenticated;
commit;
