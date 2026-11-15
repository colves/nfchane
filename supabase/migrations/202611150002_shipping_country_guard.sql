-- A SQL CHECK must explicitly reject JSON null instead of accepting UNKNOWN.
begin;
alter table private.orders add constraint orders_shipping_country_tr
  check (coalesce(shipping_address->>'country','') = 'TR');
insert into private.schema_migrations(version) values ('202611150002_shipping_country_guard');
commit;
