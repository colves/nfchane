begin;
create function public.customer_orders() returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
  if not exists(select 1 from auth.users where id=auth.uid() and email_confirmed_at is not null and deleted_at is null) then raise exception 'Verified account required' using errcode='42501';end if;
  return (select coalesce(jsonb_agg(to_jsonb(o) order by o.created_at desc),'[]'::jsonb) from
    (select id,status,is_test,pricing_complete,total_minor,created_at from private.orders where customer_user_id=auth.uid() order by created_at desc limit 100) o);
end $$;
revoke all on function public.customer_orders() from public,anon,authenticated;
grant execute on function public.customer_orders() to authenticated;
create function public.admin_link_test_order_member(_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid:=private.admin_actor();
begin
  update private.orders set customer_user_id=actor where id=_id and created_by=actor and is_test;
  if not found then raise exception 'Test order not found' using errcode='P0002';end if;
  return jsonb_build_object('ok',true);
end $$;
revoke all on function public.admin_link_test_order_member(uuid) from public,anon,authenticated;
grant execute on function public.admin_link_test_order_member(uuid) to authenticated;
insert into private.schema_migrations(version) values('202611150004_customer_history');
commit;
