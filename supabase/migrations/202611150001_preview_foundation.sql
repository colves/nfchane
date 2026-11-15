-- NFCHane phase 1. No checkout, payment, guest insert or administrator login enabled.
begin;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table public.products (
  id text primary key check (id ~ '^[a-z][a-z0-9-]{0,39}$'),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null check (char_length(name) between 1 and 150),
  description text not null check (char_length(description) <= 2000),
  category text not null check (category in ('yorum','sosyal','isletme')),
  label text not null,
  headline text not null,
  subtitle text not null,
  tone text not null,
  symbol text not null,
  image_path text not null check (image_path like 'images/%' and image_path not like '%..%'),
  image_variants jsonb not null check (jsonb_typeof(image_variants) = 'object'),
  price_minor integer check (price_minor >= 0),
  currency text not null default 'TRY' check (currency = 'TRY'),
  sizes_cm smallint[] not null default array[5,6,7,8,9,10,11,12,13,14,15]::smallint[],
  material text not null default 'clear' check (material = 'clear'),
  thickness_mm smallint not null default 3 check (thickness_mm = 3),
  connection_methods text[] not null default array['hybrid','nfc','qr'],
  link_types text[] not null default array['static','dynamic'],
  menu_services text[] not null default array[]::text[],
  is_visible boolean not null default true,
  is_purchasable boolean not null default false check (is_purchasable = false),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (sizes_cm <@ array[5,6,7,8,9,10,11,12,13,14,15]::smallint[] and cardinality(sizes_cm) > 0),
  check (connection_methods <@ array['hybrid','nfc','qr']::text[] and cardinality(connection_methods) > 0),
  check (link_types <@ array['static','dynamic']::text[] and cardinality(link_types) > 0),
  check (menu_services <@ array['link','pdf','design-pdf','design-web']::text[]),
  check (id = 'menu' or cardinality(menu_services) = 0)
);
alter table public.products enable row level security;
revoke all on public.products from public, anon, authenticated;
grant select on public.products to anon, authenticated;
create policy products_visible_read on public.products for select to anon, authenticated using (is_visible = true);

create table private.orders (
  id uuid primary key default gen_random_uuid(),
  request_key uuid not null unique,
  customer_user_id uuid references auth.users(id) on delete set null,
  customer_email text not null check (char_length(customer_email) between 3 and 254 and position('@' in customer_email) > 1),
  customer_name text not null check (char_length(customer_name) between 1 and 150),
  customer_phone text not null check (char_length(customer_phone) between 7 and 30),
  shipping_address jsonb not null check (jsonb_typeof(shipping_address) = 'object' and shipping_address ?& array['recipient','line1','city','district','country'] and shipping_address->>'country' = 'TR'),
  billing_type text not null default 'individual' check (billing_type in ('individual','company')),
  billing_details jsonb not null default '{}'::jsonb check (jsonb_typeof(billing_details) = 'object'),
  status text not null default 'awaiting_payment' check (status in ('awaiting_payment','paid','preparing','shipped','delivered','cancelled','refunded')),
  currency text not null default 'TRY' check (currency = 'TRY'),
  subtotal_minor integer not null check (subtotal_minor >= 0),
  discount_minor integer not null default 0 check (discount_minor >= 0 and discount_minor <= subtotal_minor),
  shipping_minor integer not null check (shipping_minor >= 0),
  total_minor integer not null check (total_minor = subtotal_minor - discount_minor + shipping_minor),
  legal_versions jsonb not null default '{}'::jsonb check (jsonb_typeof(legal_versions) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_created_at_idx on private.orders (created_at desc);
create index orders_customer_user_idx on private.orders (customer_user_id) where customer_user_id is not null;
create index orders_status_idx on private.orders (status);

create table private.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references private.orders(id) on delete restrict,
  line_number smallint not null check (line_number > 0),
  product_id text not null references public.products(id) on delete restrict,
  product_name text not null,
  product_image_path text not null,
  size_cm smallint not null check (size_cm between 5 and 15),
  material text not null default 'clear' check (material = 'clear'),
  thickness_mm smallint not null default 3 check (thickness_mm = 3),
  connection_method text not null check (connection_method in ('hybrid','nfc','qr')),
  link_type text not null check (link_type in ('static','dynamic')),
  menu_service text check (menu_service in ('link','pdf','design-pdf','design-web')),
  quantity integer not null check (quantity between 1 and 1000),
  unit_price_minor integer not null check (unit_price_minor >= 0),
  line_total_minor integer not null check (line_total_minor::bigint = unit_price_minor::bigint * quantity),
  personalization jsonb not null default '{}'::jsonb check (jsonb_typeof(personalization) = 'object' and octet_length(personalization::text) <= 16000),
  created_at timestamptz not null default now(),
  unique(order_id, line_number),
  check (connection_method <> 'nfc' or link_type = 'static'),
  check ((product_id = 'menu' and menu_service is not null) or (product_id <> 'menu' and menu_service is null))
);

create table private.order_status_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references private.orders(id) on delete restrict,
  from_status text check (from_status in ('awaiting_payment','paid','preparing','shipped','delivered','cancelled','refunded')),
  to_status text not null check (to_status in ('awaiting_payment','paid','preparing','shipped','delivered','cancelled','refunded')),
  actor_user_id uuid references auth.users(id) on delete set null,
  note text check (char_length(note) <= 1000),
  created_at timestamptz not null default now()
);
create index order_status_events_order_idx on private.order_status_events (order_id, created_at);

create table private.shipments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references private.orders(id) on delete restrict,
  provider text not null default 'manual',
  carrier_name text,
  tracking_number text,
  status text not null default 'pending' check (status in ('pending','shipped','delivered','returned')),
  shipped_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index shipments_order_idx on private.shipments (order_id);

create table private.invoices (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references private.orders(id) on delete restrict,
  document_type text check (document_type in ('e_invoice','e_archive')),
  invoice_number text,
  issued_at timestamptz,
  private_document_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index invoices_order_idx on private.invoices (order_id);

create table private.admin_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','operator')),
  created_at timestamptz not null default now()
);
create table private.schema_migrations (
  version text primary key,
  applied_at timestamptz not null default now()
);

alter table private.orders enable row level security;
alter table private.order_items enable row level security;
alter table private.order_status_events enable row level security;
alter table private.shipments enable row level security;
alter table private.invoices enable row level security;
alter table private.admin_members enable row level security;
alter table private.schema_migrations enable row level security;
-- No customer/guest/admin browser policies in this phase. No role is assigned automatically.
revoke all on all tables in schema private from public, anon, authenticated;
revoke all on all sequences in schema private from public, anon, authenticated;
alter default privileges in schema private revoke all on tables from public, anon, authenticated;
alter default privileges in schema private revoke all on sequences from public, anon, authenticated;
alter default privileges in schema private revoke execute on functions from public, anon, authenticated;

create function private.touch_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = pg_catalog.now(); return new; end;
$$;
revoke all on function private.touch_updated_at() from public, anon, authenticated;
create trigger products_updated_at before update on public.products for each row execute function private.touch_updated_at();
create trigger orders_updated_at before update on private.orders for each row execute function private.touch_updated_at();
create trigger shipments_updated_at before update on private.shipments for each row execute function private.touch_updated_at();
create trigger invoices_updated_at before update on private.invoices for each row execute function private.touch_updated_at();
insert into private.schema_migrations (version) values ('202611150001_preview_foundation');
commit;
