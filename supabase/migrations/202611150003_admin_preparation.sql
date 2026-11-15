begin;
create table private.admin_allowlist (
  email text primary key check(email = lower(email)),
  role text not null check(role in ('owner','operator')),
  created_at timestamptz not null default now()
);
create table private.admin_audit (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  record_id text not null,
  created_at timestamptz not null default now()
);
create table private.order_access_tokens (
  order_id uuid primary key references private.orders(id) on delete cascade,
  token_hash text not null unique check(token_hash ~ '^[0-9a-f]{64}$'),
  expires_at timestamptz not null default now()+interval '30 days'
);
alter table private.admin_allowlist enable row level security;
alter table private.admin_audit enable row level security;
alter table private.order_access_tokens enable row level security;
revoke all on private.admin_allowlist, private.admin_audit, private.order_access_tokens from public,anon,authenticated;
alter table private.orders add column is_test boolean not null default true check(is_test = true);
alter table private.orders add column pricing_complete boolean not null default false;
alter table private.orders add column created_by uuid references auth.users(id) on delete set null;
alter table private.orders add column request_fingerprint text;
alter table private.order_items add column price_missing boolean not null default true;
update public.products set sizes_cm=array[10]::smallint[];
alter table public.products alter column sizes_cm set default array[10]::smallint[];
alter table public.products add constraint products_fixed_size check(sizes_cm=array[10]::smallint[]);
alter table private.order_items add constraint order_items_fixed_size check(size_cm=10);

create function private.admin_actor() returns uuid language plpgsql stable security definer set search_path='' as $$
declare actor uuid;
begin
  select u.id into actor from auth.users u join private.admin_allowlist a on a.email=lower(u.email)
    where u.id=auth.uid() and u.email_confirmed_at is not null and u.deleted_at is null;
  if actor is null then raise exception 'Administrator required' using errcode='42501'; end if;
  return actor;
end $$;
revoke all on function private.admin_actor() from public,anon,authenticated;

create function public.admin_session() returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid := private.admin_actor(); result jsonb;
begin
  insert into private.admin_members(user_id,role)
    select actor,a.role from private.admin_allowlist a join auth.users u on lower(u.email)=a.email where u.id=actor
    on conflict(user_id) do update set role=excluded.role;
  select jsonb_build_object('id',u.id,'email',u.email,'role',a.role) into result
    from auth.users u join private.admin_allowlist a on a.email=lower(u.email) where u.id=actor;
  return result;
end $$;

create function public.admin_products() returns jsonb language plpgsql security definer set search_path='' as $$
begin
  perform private.admin_actor();
  return (select coalesce(jsonb_agg(to_jsonb(p) order by p.sort_order),'[]'::jsonb) from public.products p);
end $$;

create function public.admin_update_product(_id text,_data jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid := private.admin_actor(); result jsonb;
begin
  if char_length(coalesce(_data->>'name','')) not between 1 and 150 or char_length(coalesce(_data->>'description','')) not between 1 and 2000
    or (_data->>'name'||_data->>'description') ~ '[<>"&]' then raise exception 'Invalid product text' using errcode='22023'; end if;
  update public.products set name=_data->>'name', description=_data->>'description',price_minor=(_data->>'price_minor')::integer
    where id=_id returning to_jsonb(products) into result;
  if result is null then raise exception 'Product not found' using errcode='P0002'; end if;
  insert into private.admin_audit(actor_user_id,action,record_id) values(actor,'product.update',_id);
  return result;
end $$;

create function public.admin_orders(_status text default null) returns jsonb language plpgsql security definer set search_path='' as $$
begin
  perform private.admin_actor();
  return jsonb_build_object(
    'summary',(select jsonb_build_object('total',count(*),'pending',count(*) filter(where status='awaiting_payment'),'test',count(*) filter(where is_test),'sales_minor',coalesce(sum(total_minor) filter(where not is_test and status in ('paid','preparing','shipped','delivered')),0)) from private.orders),
    'orders',(select coalesce(jsonb_agg(to_jsonb(o) order by o.created_at desc),'[]'::jsonb) from
      (select id,customer_name,customer_email,status,is_test,pricing_complete,total_minor,created_at from private.orders where _status is null or status=_status order by created_at desc limit 100) o));
end $$;

create function public.admin_order_detail(_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
  perform private.admin_actor();
  select jsonb_build_object('order',to_jsonb(o),
    'items',(select coalesce(jsonb_agg(to_jsonb(i) order by i.line_number),'[]'::jsonb) from private.order_items i where i.order_id=o.id),
    'events',(select coalesce(jsonb_agg(to_jsonb(e) order by e.created_at desc),'[]'::jsonb) from private.order_status_events e where e.order_id=o.id),
    'shipment',(select to_jsonb(s) from private.shipments s where s.order_id=o.id order by s.created_at desc limit 1),
    'invoice',(select to_jsonb(v) from private.invoices v where v.order_id=o.id order by v.created_at desc limit 1)) into result from private.orders o where o.id=_id;
  if result is null then raise exception 'Order not found' using errcode='P0002'; end if;
  return result;
end $$;

create function public.admin_create_test_order(_payload jsonb,_token_hash text) returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid := private.admin_actor(); request_id uuid := (_payload->>'requestKey')::uuid;
  fingerprint text := encode(sha256(convert_to(_payload::text,'UTF8')),'hex'); existing private.orders; order_id uuid; item jsonb; p public.products; line_no integer:=0; subtotal integer:=0; unit integer;
begin
  if _payload->>'confirmTest' is distinct from 'true' or jsonb_typeof(_payload->'items') is distinct from 'array' or jsonb_array_length(_payload->'items') not between 1 and 30 then raise exception 'Invalid test order' using errcode='22023'; end if;
  perform pg_advisory_xact_lock(hashtext(request_id::text)::bigint);
  select * into existing from private.orders where request_key=request_id;
  if found then
    if existing.created_by is distinct from actor or existing.request_fingerprint is distinct from fingerprint then raise exception 'Request key conflict' using errcode='23505'; end if;
    return jsonb_build_object('id',existing.id,'created',false);
  end if;
  insert into private.orders(request_key,customer_name,customer_email,customer_phone,shipping_address,billing_type,billing_details,subtotal_minor,shipping_minor,total_minor,is_test,pricing_complete,created_by,request_fingerprint)
    values(request_id,_payload#>>'{contact,name}',_payload#>>'{contact,email}',_payload#>>'{contact,phone}',_payload->'address',_payload#>>'{billing,type}',_payload->'billing',0,0,0,true,false,actor,fingerprint) returning id into order_id;
  for item in select value from jsonb_array_elements(_payload->'items') loop
    select * into p from public.products where id=item->>'productId' and is_visible;
    if not found then raise exception 'Product unavailable' using errcode='22023'; end if;
    unit:=coalesce(p.price_minor,0); line_no:=line_no+1;
    insert into private.order_items(order_id,line_number,product_id,product_name,product_image_path,size_cm,material,connection_method,link_type,menu_service,quantity,unit_price_minor,line_total_minor,personalization,price_missing)
      values(order_id,line_no,p.id,p.name,p.image_variants->>(item->>'connection'),(item->>'sizeCm')::smallint,item->>'material',item->>'connection',item->>'linkType',item->>'menuService',(item->>'quantity')::integer,unit,unit*(item->>'quantity')::integer,item->'personalization',p.price_minor is null);
    subtotal:=subtotal+unit*(item->>'quantity')::integer;
  end loop;
  -- Shipping is not configured: this is never a payable quote, even with product prices.
  update private.orders set subtotal_minor=subtotal,total_minor=subtotal where id=order_id;
  insert into private.order_access_tokens(order_id,token_hash) values(order_id,_token_hash);
  insert into private.order_status_events(order_id,to_status,actor_user_id,note) values(order_id,'awaiting_payment',actor,'Hazırlık testi; ödeme alınmaz.');
  insert into private.admin_audit(actor_user_id,action,record_id) values(actor,'order.test.create',order_id::text);
  return jsonb_build_object('id',order_id,'created',true);
end $$;

create function public.admin_update_order_status(_id uuid,_status text) returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid := private.admin_actor(); previous text;
begin
  if _status not in ('awaiting_payment','paid','preparing','shipped','delivered','cancelled','refunded') then raise exception 'Invalid status' using errcode='22023'; end if;
  select status into previous from private.orders where id=_id and is_test for update;
  if not found then raise exception 'Test order not found' using errcode='P0002'; end if;
  if previous is distinct from _status then
    update private.orders set status=_status where id=_id;
    insert into private.order_status_events(order_id,from_status,to_status,actor_user_id,note) values(_id,previous,_status,actor,'Test durum değişikliği; gerçek ödeme/iade değildir.');
    insert into private.admin_audit(actor_user_id,action,record_id) values(actor,'order.test.status',_id::text);
  end if;
  return public.admin_order_detail(_id);
end $$;

create function public.admin_update_fulfilment(_id uuid,_data jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid := private.admin_actor(); shipment_id uuid; invoice_id uuid;
begin
  perform id from private.orders where id=_id and is_test for update;
  if not found then raise exception 'Test order not found' using errcode='P0002'; end if;
  select id into shipment_id from private.shipments where order_id=_id order by created_at desc limit 1;
  if shipment_id is null then insert into private.shipments(order_id) values(_id) returning id into shipment_id; end if;
  update private.shipments set carrier_name=nullif(_data->>'carrier',''),tracking_number=nullif(_data->>'trackingNumber','') where id=shipment_id;
  select id into invoice_id from private.invoices where order_id=_id order by created_at desc limit 1;
  if invoice_id is null then insert into private.invoices(order_id) values(_id) returning id into invoice_id; end if;
  update private.invoices set document_type=nullif(_data->>'invoiceType',''),invoice_number=nullif(_data->>'invoiceNumber',''),issued_at=nullif(_data->>'invoiceDate','')::timestamptz where id=invoice_id;
  insert into private.admin_audit(actor_user_id,action,record_id) values(actor,'order.test.fulfilment',_id::text);
  return public.admin_order_detail(_id);
end $$;

create function public.admin_track_test_order(_token_hash text) returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
  perform private.admin_actor();
  select jsonb_build_object('id',o.id,'status',o.status,'is_test',o.is_test,'created_at',o.created_at,
    'items',(select jsonb_agg(jsonb_build_object('name',i.product_name,'quantity',i.quantity)) from private.order_items i where i.order_id=o.id),
    'shipment',(select jsonb_build_object('carrier',s.carrier_name,'tracking_number',s.tracking_number) from private.shipments s where s.order_id=o.id order by s.created_at desc limit 1)) into result
    from private.orders o join private.order_access_tokens t on t.order_id=o.id where t.token_hash=_token_hash and t.expires_at>now() and o.is_test;
  if result is null then raise exception 'Tracking record not found' using errcode='P0002'; end if;
  return result;
end $$;

revoke all on function public.admin_session(),public.admin_products(),public.admin_update_product(text,jsonb),public.admin_orders(text),public.admin_order_detail(uuid),public.admin_create_test_order(jsonb,text),public.admin_update_order_status(uuid,text),public.admin_update_fulfilment(uuid,jsonb),public.admin_track_test_order(text) from public,anon,authenticated;
grant execute on function public.admin_session(),public.admin_products(),public.admin_update_product(text,jsonb),public.admin_orders(text),public.admin_order_detail(uuid),public.admin_create_test_order(jsonb,text),public.admin_update_order_status(uuid,text),public.admin_update_fulfilment(uuid,jsonb),public.admin_track_test_order(text) to authenticated;
insert into private.schema_migrations(version) values ('202611150003_admin_preparation');
commit;
