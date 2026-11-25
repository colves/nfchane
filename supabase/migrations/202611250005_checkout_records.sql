begin;

-- Checkout and payment records are server-only. Existing test orders remain valid.
create table private.order_checkout_reviews (
  order_id uuid primary key references private.orders(id) on delete restrict,
  review_id text not null check (review_id ~ '^[0-9a-f]{64}$'),
  snapshot jsonb not null check (
    jsonb_typeof(snapshot) = 'object'
    and coalesce(jsonb_typeof(snapshot->'documents') = 'object', false)
    and coalesce(jsonb_typeof(snapshot->'totals') = 'object', false)
  ),
  accepted_at timestamptz not null
);

create table private.order_payments (
  order_id uuid primary key references private.order_checkout_reviews(order_id) on delete restrict,
  merchant_reference text not null unique check (merchant_reference ~ '^[A-Za-z0-9]{1,64}$'),
  amount_minor integer not null check (amount_minor > 0),
  currency text not null check (currency = 'TRY'),
  method text not null check (method = 'card'),
  is_test boolean not null,
  verified_at timestamptz not null
);

create table private.order_document_deliveries (
  order_id uuid primary key references private.order_payments(order_id) on delete restrict,
  created_at timestamptz not null default now(),
  provider_message_reference text,
  sent_at timestamptz,
  check ((sent_at is null) = (provider_message_reference is null))
);

-- Payment and the attachment job must be committed together by the future payment handler.
-- At launch the handler must still verify the stored attempt and lock the order row.
alter table private.order_checkout_reviews enable row level security;
alter table private.order_payments enable row level security;
alter table private.order_document_deliveries enable row level security;
revoke all on private.order_checkout_reviews, private.order_payments, private.order_document_deliveries from public, anon, authenticated;

create function private.record_verified_paytr_payment(
  payment_order_id uuid, payment_reference text, payment_amount integer, test_payment boolean
) returns boolean language plpgsql set search_path = '' as $$
declare
  current_order private.orders;
  recorded_payment private.order_payments;
  approved_total text;
  verified_time timestamptz := now();
begin
  select * into strict current_order from private.orders where id = payment_order_id for update;
  select * into recorded_payment from private.order_payments where order_id = payment_order_id;
  if found then
    if recorded_payment.merchant_reference = payment_reference
       and recorded_payment.amount_minor = payment_amount
       and recorded_payment.is_test = test_payment then
      return false;
    end if;
    raise exception 'Conflicting payment notification' using errcode = '23505';
  end if;

  select snapshot #>> '{totals,totalMinor}' into approved_total
    from private.order_checkout_reviews where order_id = payment_order_id;
  if current_order.status <> 'awaiting_payment' or not current_order.pricing_complete
     or current_order.is_test is distinct from test_payment
     or current_order.total_minor is distinct from payment_amount
     or approved_total is distinct from payment_amount::text
     or payment_amount is null or payment_amount <= 0 then
    raise exception 'Payment does not match the accepted order' using errcode = '22023';
  end if;

  insert into private.order_payments values
    (payment_order_id, payment_reference, payment_amount, 'TRY', 'card', test_payment, verified_time);
  insert into private.order_document_deliveries(order_id) values (payment_order_id);
  update private.orders set status = 'paid' where id = payment_order_id;
  insert into private.order_status_events(order_id, from_status, to_status, note)
    values (payment_order_id, 'awaiting_payment', 'paid', 'PayTR bildirimi doğrulandı.');
  return true;
end
$$;
revoke all on function private.record_verified_paytr_payment(uuid, text, integer, boolean)
  from public, anon, authenticated;

insert into private.schema_migrations(version) values ('202611250005_checkout_records');

commit;
