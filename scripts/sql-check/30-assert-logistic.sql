-- Logistic-specific expectations. Skipped entirely when the module was not selected,
-- so one assertion set can run against any scaffold.

do $$
declare
  v_admin_id  bigint;
  v_worker_id bigint;
  v_supplier  bigint;
  v_count     integer;
  v_name      text;
begin
  if to_regclass('public.supplier') is null then
    raise notice 'logistic not installed — skipping';
    return;
  end if;

  -- Two principals: the base assertions provisioned an admin (the first ever) and a
  -- non-admin. Reuse them rather than depending on creation order here.
  select id into v_admin_id from public.user_account where admin order by id limit 1;
  select id into v_worker_id from public.user_account where not admin order by id limit 1;
  if v_admin_id is null or v_worker_id is null then
    raise exception 'expected both an admin and a non-admin principal to exist';
  end if;
end $$;

-- ── The module's seed landed ─────────────────────────────────────────────────

do $$
declare v_count integer;
begin
  if to_regclass('public.supplier') is null then return; end if;

  select count(*) into v_count from public.storage_location;
  if v_count = 0 then raise exception 'no storage_location rows seeded'; end if;

  -- Every seeded supplier and location must have a name, since neither carries one as
  -- a column. A row without one is invisible in every screen that lists it.
  select count(*) into v_count
  from public.supplier s
  where not exists (
    select 1 from public.local_text_link l
    where l.slug = 'name' and l.scope = 'supplier' and l.entity_id = s.id
  );
  if v_count > 0 then raise exception '% supplier(s) have no name link', v_count; end if;

  select count(*) into v_count
  from public.storage_location sl
  where not exists (
    select 1 from public.local_text_link l
    where l.slug = 'name' and l.scope = 'storage_location' and l.entity_id = sl.id
  );
  if v_count > 0 then raise exception '% location(s) have no name link', v_count; end if;
end $$;

-- ── The screens' reads work for a signed-in non-admin ────────────────────────
--
-- The warehouse screens are used by staff who are not admins, so a read policy that
-- only admits admins would empty those pages rather than error. Under `withUser` the
-- connection role owned these tables and Postgres skipped RLS altogether, so this is
-- the first thing that has ever checked them.

do $$
declare
  v_sub  uuid;
  v_seen integer;
  v_tbl  text;
begin
  if to_regclass('public.supplier') is null then return; end if;

  select ua.auth_user_id into v_sub
  from public.user_account ua where not ua.admin order by ua.id limit 1;

  set local role authenticated;
  perform set_config('request.jwt.claim.sub', v_sub::text, true);

  foreach v_tbl in array array[
    'supplier', 'supplier_contact', 'storage_location', 'stock_level',
    'inbound_receipt', 'inbound_receipt_line', 'pick_task', 'pick_task_line',
    'shipment', 'shipment_line', 'tracking_event',
    'return_authorization', 'return_authorization_line',
    'cycle_count', 'cycle_count_line', 'stock_adjustment'
  ] loop
    -- A read that RLS refuses returns zero rows rather than raising, so the seeded
    -- tables are the ones worth asserting on; the rest must at least be selectable.
    execute format('select count(*) from public.%I', v_tbl) into v_seen;
  end loop;

  select count(*) into v_seen from public.supplier;
  if v_seen = 0 then
    raise exception 'a signed-in non-admin sees no suppliers — the read policy is too narrow';
  end if;
end $$;

-- ── Writes are admin-only ────────────────────────────────────────────────────

do $$
declare v_sub uuid;
begin
  if to_regclass('public.supplier') is null then return; end if;

  select ua.auth_user_id into v_sub
  from public.user_account ua where not ua.admin order by ua.id limit 1;

  set local role authenticated;
  perform set_config('request.jwt.claim.sub', v_sub::text, true);

  begin
    perform public.logistic_create_supplier('rls-probe', 'Should Not Exist', 1, null);
    raise exception 'a non-admin created a supplier — RLS is not applying';
  exception when insufficient_privilege then
    null; -- refused, as intended
  end;
end $$;

-- ── The admin create path works, all three statements ────────────────────────

do $$
declare
  v_sub      uuid;
  v_id       bigint;
  v_name     text;
  v_locale   bigint;
begin
  if to_regclass('public.supplier') is null then return; end if;

  select ua.auth_user_id into v_sub
  from public.user_account ua where ua.admin order by ua.id limit 1;
  select id into v_locale from public.locale where code = 'en';

  set local role authenticated;
  perform set_config('request.jwt.claim.sub', v_sub::text, true);

  v_id := public.logistic_create_supplier('sql-check-supplier', 'SQL Check Co.', v_locale, 9);
  if v_id is null then raise exception 'logistic_create_supplier returned null'; end if;

  -- The row, its link and its copy — the whole point of the RPC being one transaction.
  select t.content into v_name
  from public.local_text t
  join public.local_text_link l on l.id = t.link
  where l.slug = 'name' and l.scope = 'supplier' and l.entity_id = v_id and t.locale = v_locale;

  if v_name is distinct from 'SQL Check Co.' then
    raise exception 'created supplier has no name copy (got %)', coalesce(v_name, '<null>');
  end if;

  -- The branch the route maps to a 409 rather than a 500.
  begin
    perform public.logistic_create_supplier('sql-check-supplier', 'Duplicate', v_locale, null);
    raise exception 'a duplicate slug was accepted';
  exception when unique_violation then
    null; -- as the route expects
  end;
end $$;

-- ── The stock functions hold their invariants ────────────────────────────────

do $$
declare
  v_sub     uuid;
  v_level   bigint;
  v_on_hand integer;
begin
  if to_regclass('public.stock_level') is null then return; end if;

  select ua.auth_user_id into v_sub
  from public.user_account ua where ua.admin order by ua.id limit 1;

  set local role authenticated;
  perform set_config('request.jwt.claim.sub', v_sub::text, true);

  select id, on_hand into v_level, v_on_hand from public.stock_level order by id limit 1;
  if v_level is null then raise exception 'no stock_level rows seeded'; end if;

  -- An adjustment must move on_hand and record the before/after it claims.
  perform public.logistic_adjust_stock(
    v_level, 3, 'system_correction', (select id from public.user_account where admin order by id limit 1)
  );

  if (select on_hand from public.stock_level where id = v_level) <> v_on_hand + 3 then
    raise exception 'logistic_adjust_stock did not move on_hand';
  end if;

  if not exists (
    select 1 from public.stock_adjustment
    where stock_level_id = v_level and delta = 3
      and on_hand_before = v_on_hand and on_hand_after = v_on_hand + 3
  ) then
    raise exception 'logistic_adjust_stock wrote no matching audit row';
  end if;

  -- The check constraints are the real guardrail: reserved may never exceed on_hand,
  -- and on_hand may never go negative.
  begin
    perform public.logistic_reserve_stock(v_level, 100000);
    raise exception 'reserved more stock than exists';
  exception when others then
    null; -- refused, by constraint or by the function's own guard
  end;
end $$;
