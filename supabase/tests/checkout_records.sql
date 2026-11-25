begin;
do $$
declare
  test_order_id uuid;
  payment_reference text := 'NFCHaneFixture01';
begin
  insert into private.orders(request_key, customer_name, customer_email, customer_phone, shipping_address,
    subtotal_minor, shipping_minor, total_minor, is_test, pricing_complete)
  values (gen_random_uuid(), 'Örnek', 'test@example.invalid', '905551234567',
    '{"recipient":"Örnek","line1":"Test","city":"Sakarya","district":"Serdivan","country":"TR"}',
    12000, 1200, 13200, true, true) returning private.orders.id into test_order_id;

  insert into private.order_checkout_reviews(order_id, review_id, snapshot, accepted_at)
  values (test_order_id, repeat('a',64), '{"documents":{},"totals":{"totalMinor":13200}}', now());

  begin
    perform private.record_verified_paytr_payment(test_order_id, payment_reference, 13199, true);
    raise exception 'Incorrect amount was accepted';
  exception when invalid_parameter_value then null;
  end;
  begin
    perform private.record_verified_paytr_payment(test_order_id, payment_reference, 13200, false);
    raise exception 'Test/real mode mismatch was accepted';
  exception when invalid_parameter_value then null;
  end;

  if private.record_verified_paytr_payment(test_order_id, payment_reference, 13200, true) is distinct from true then
    raise exception 'Expected a new verified test payment';
  end if;
  if private.record_verified_paytr_payment(test_order_id, payment_reference, 13200, true) is distinct from false then
    raise exception 'Duplicate callback was processed twice';
  end if;
  if (select status from private.orders where orders.id=test_order_id) is distinct from 'paid'
     or (select count(*) from private.order_document_deliveries where order_id=test_order_id) <> 1
     or (select count(*) from private.order_status_events where order_id=test_order_id and to_status='paid') <> 1 then
    raise exception 'Payment, send queue and status were not written exactly once';
  end if;
  if has_table_privilege('anon','private.order_checkout_reviews','select')
     or has_table_privilege('authenticated','private.order_payments','insert')
     or has_function_privilege('authenticated','private.record_verified_paytr_payment(uuid,text,integer,boolean)','execute') then
    raise exception 'Browser roles can access checkout or payment records';
  end if;
end $$;
rollback;
