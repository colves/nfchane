-- Run after migration + seed in SQL Editor. Transaction leaves no test records behind.
begin;
do $$
declare t record;
begin
  if (select count(*) from public.products) <> 7 then raise exception 'Expected seven catalog products'; end if;
  if exists(select 1 from public.products where price_minor is not null or is_purchasable) then raise exception 'Preview price/sales guard failed'; end if;
  for t in select schemaname, tablename, rowsecurity from pg_tables where schemaname = 'private' or (schemaname = 'public' and tablename = 'products') loop
    if not t.rowsecurity then raise exception 'RLS missing on %.%',t.schemaname,t.tablename; end if;
  end loop;
  if has_schema_privilege('anon','private','USAGE') or has_schema_privilege('authenticated','private','USAGE') then raise exception 'Private schema is accessible'; end if;
  if has_table_privilege('anon','public.products','INSERT,UPDATE,DELETE') or has_table_privilege('authenticated','public.products','INSERT,UPDATE,DELETE') then raise exception 'Catalog browser write privilege detected'; end if;
  if exists(select 1 from pg_policies where schemaname = 'private') then raise exception 'Private browser policy unexpectedly exists'; end if;
end $$;

-- A hidden product cannot be read through the anonymous role.
update public.products set is_visible = false where id = 'google';
set local role anon;
do $$
begin
  if (select count(*) from public.products) <> 6 or exists(select 1 from public.products where id = 'google') then raise exception 'Anonymous visibility RLS failed'; end if;
  begin
    update public.products set name = 'Unauthorized change' where id = 'instagram';
    raise exception 'Unauthorized update unexpectedly succeeded';
  exception when insufficient_privilege then null; end;
  begin
    perform id from private.orders limit 1;
    raise exception 'Guest order read unexpectedly succeeded';
  exception when insufficient_privilege then null; end;
  begin
    insert into private.admin_members(user_id,role) values(gen_random_uuid(),'owner');
    raise exception 'Guest admin escalation unexpectedly succeeded';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
set local role authenticated;
do $$
begin
  if (select count(*) from public.products) <> 6 then raise exception 'Authenticated visibility RLS failed'; end if;
  begin
    perform id from private.orders limit 1;
    raise exception 'Signed-in order read unexpectedly succeeded';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.products(id,slug,name) values('bad','bad','Unauthorized');
    raise exception 'Signed-in catalog insert unexpectedly succeeded';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

-- A guest order can be represented without an Auth account, but is never persisted here.
do $$
declare test_order uuid;
begin
  insert into private.orders(request_key,customer_email,customer_name,customer_phone,shipping_address,subtotal_minor,shipping_minor,total_minor)
    values(gen_random_uuid(),'preview-test@example.invalid','Preview Test','0000000000','{"recipient":"Preview Test","line1":"Test","city":"Test","district":"Test","country":"TR"}',100,0,100)
    returning id into test_order;
  if (select customer_user_id from private.orders where id = test_order) is not null then raise exception 'Guest unexpectedly requires an account'; end if;
  insert into private.order_items(order_id,line_number,product_id,product_name,product_image_path,size_cm,connection_method,link_type,quantity,unit_price_minor,line_total_minor)
    values(test_order,1,'google','Preview Test','images/test.webp',10,'nfc','static',1,100,100);
  begin
    update private.orders set shipping_address = shipping_address || '{"country":null}'::jsonb where id = test_order;
    raise exception 'Null destination country accepted';
  exception when check_violation then null; end;
  begin
    update private.orders set shipping_address = shipping_address || '{"country":"DE"}'::jsonb where id = test_order;
    raise exception 'Non-TR destination accepted';
  exception when check_violation then null; end;
  begin
    update private.order_items set link_type = 'dynamic' where order_id = test_order;
    raise exception 'NFC-only dynamic QR option accepted';
  exception when check_violation then null; end;
end $$;

-- Database guards enforce Turkish preview prices and valid card combinations.
do $$
begin
  begin update public.products set price_minor = -1 where id = 'google'; raise exception 'Negative price accepted'; exception when check_violation then null; end;
  begin update public.products set is_purchasable = true where id = 'google'; raise exception 'Sales opened'; exception when check_violation then null; end;
end $$;
select 'PASS: RLS, denied writes/reads/escalation, hidden products, guest schema, TR address, NFC static, preview guard' as security_checks;
rollback;
