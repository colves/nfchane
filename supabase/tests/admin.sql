-- Verified administrator and non-administrator integration checks. Leaves no users/orders.
begin;
insert into auth.users(id,email,email_confirmed_at,raw_app_meta_data,raw_user_meta_data)
  values ('54b0f04d-8c1a-4bfd-9bce-daf3d948f867','admin-fixture@example.invalid',now(),'{"provider":"email","providers":["email"]}','{}'),
         ('84b0f04d-8c1a-4bfd-9bce-daf3d948f867','nonadmin-fixture@example.invalid',now(),'{"provider":"email","providers":["email"]}','{}');
insert into private.admin_allowlist(email,role) values('admin-fixture@example.invalid','owner');
select set_config('request.jwt.claims','{"sub":"84b0f04d-8c1a-4bfd-9bce-daf3d948f867","role":"authenticated","email":"admin-fixture@example.invalid"}',true);
set local role authenticated;
do $$begin
  begin perform public.admin_products(); raise exception 'Unapproved identity accepted'; exception when insufficient_privilege then null; end;
  begin perform public.admin_orders(); raise exception 'Unapproved order read accepted'; exception when insufficient_privilege then null; end;
  if jsonb_array_length(public.customer_orders())<>0 then raise exception 'Unrelated customer sees orders';end if;
end $$;
reset role;
select set_config('request.jwt.claims','{"sub":"54b0f04d-8c1a-4bfd-9bce-daf3d948f867","role":"authenticated"}',true);
set local role authenticated;
do $$
declare payload jsonb; result jsonb; repeated jsonb; details jsonb; changed jsonb; test_id uuid;
begin
  perform public.admin_session();
  if jsonb_array_length(public.admin_products())<>7 then raise exception 'Admin catalog count'; end if;
  payload=jsonb_build_object('requestKey','d79fd931-15e9-44b2-85df-091fa5ad6423','confirmTest',true,'contact',jsonb_build_object('name','Hazırlık Testi','email','fixture@example.invalid','phone','905551234567'),'address','{"recipient":"Test","line1":"Test","city":"Sakarya","district":"Serdivan","postcode":"54000","country":"TR"}'::jsonb,'billing','{"type":"individual","name":"Test"}'::jsonb,'items','[{"productId":"google","sizeCm":10,"material":"clear","connection":"nfc","linkType":"static","quantity":2,"menuService":null,"personalization":{"businessName":"Test","targetUrl":"https://example.invalid"},"unit_price_minor":1}]'::jsonb);
  result=public.admin_create_test_order(payload,repeat('a',64));test_id=(result->>'id')::uuid;
  repeated=public.admin_create_test_order(payload,repeat('b',64));
  if result->>'id' is distinct from repeated->>'id' or repeated->>'created' is distinct from 'false' then raise exception 'Idempotency failed'; end if;
  details=public.admin_order_detail(test_id);
  perform public.admin_link_test_order_member(test_id);
  if jsonb_array_length(public.customer_orders())<>1 then raise exception 'Member history mismatch';end if;
  if details#>>'{order,is_test}' is distinct from 'true' or details#>>'{order,pricing_complete}' is distinct from 'false' or details#>>'{items,0,price_missing}' is distinct from 'true' then raise exception 'Test price guard failed'; end if;
  begin perform public.admin_create_test_order(jsonb_set(payload,'{contact,name}','"Different"'),repeat('c',64));raise exception 'Changed duplicate accepted';exception when unique_violation then null;end;
  perform public.admin_update_order_status(test_id,'preparing');
  perform public.admin_update_fulfilment(test_id,'{"carrier":"Test Kargo","trackingNumber":"TEST123","invoiceType":null,"invoiceNumber":"","invoiceDate":null}');
  changed=public.admin_track_test_order(repeat('a',64));
  if changed->>'status' is distinct from 'preparing' or changed#>>'{shipment,tracking_number}' is distinct from 'TEST123' then raise exception 'Tracking workflow failed';end if;
  if changed ? 'shipping_address' or changed ? 'customer_email' then raise exception 'Tracking leaks personal details';end if;
  begin perform public.admin_track_test_order(repeat('b',64));raise exception 'Wrong tracking token accepted';exception when no_data_found then null;end;
end $$;
reset role;
set local role anon;
do $$begin
  begin perform public.admin_session(); raise exception 'Anonymous admin session accepted';exception when insufficient_privilege then null;end;
end $$;
reset role;
select 'PASS: verified admin, spoofed email denied, test create, idempotency, DB prices, status, shipping, private tracking' as admin_checks;
rollback;
