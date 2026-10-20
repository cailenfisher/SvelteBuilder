-- Logistic-specific expectations. Skipped entirely when the module was not selected,
-- so one assertion set can run against any scaffold.
--
-- Since access control (docs/ACCESS-CONTROL.md §7, A22) every logistic table is governed by
-- a permission, so the checks impersonate three principals made for this file:
--   …b001 Manager (logistic_manager)   …b002 Operator (logistic_operator)   …b003 holds nothing
-- Scenes are set as the owner, which RLS does not apply to, and every check that matters runs
-- as one of them. The Clarion field test's findings 4, 5 and 7 each have a check below.

-- ── Fixtures ──────────────────────────────────────────────────────────────────

insert into auth.users (id, email)
select ('bbbbbbbb-0000-4000-8000-00000000b00' || n)::uuid, 'logistic-' || n || '@example.test'
from generate_series(1, 3) as n
where to_regclass('public.supplier') is not null
on conflict (id) do nothing;

do $$
declare
  n integer;
begin
  if to_regclass('public.supplier') is null then
    raise notice 'logistic not installed — skipping';
    return;
  end if;
  for n in 1..3 loop
    set local role authenticated;
    perform set_config('request.jwt.claim.sub', 'bbbbbbbb-0000-4000-8000-00000000b00' || n, true);
    perform public.ensure_user_account();
    reset role;
  end loop;

  insert into public.role_assignment (role_id, user_account_id, scope)
  select r.id, ua.id, null
  from public.role r
  join public.user_account ua on ua.auth_user_id = (
    case r.slug
      when 'logistic_manager' then 'bbbbbbbb-0000-4000-8000-00000000b001'
      else 'bbbbbbbb-0000-4000-8000-00000000b002'
    end
  )::uuid
  where r.slug in ('logistic_manager', 'logistic_operator')
  on conflict do nothing;
end $$;

create function pg_temp.account_id(p_n integer) returns bigint language sql stable security definer as $$
  select ua.id from public.user_account ua
  where ua.auth_user_id = ('bbbbbbbb-0000-4000-8000-00000000b00' || p_n)::uuid
$$;

create function pg_temp.sign_in(p_n integer) returns void language plpgsql as $$
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', 'bbbbbbbb-0000-4000-8000-00000000b00' || p_n, true);
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

  if (select count(*) from public.role where slug in ('logistic_manager', 'logistic_operator')) <> 2 then
    raise exception 'the logistic roles are not seeded';
  end if;
end $$;

-- ── Signed in is not staff (A22; finding 5) ──────────────────────────────────
--
-- Supabase signs up anyone with an email address, so a policy for `authenticated` is a policy
-- for the public. Someone holding no logistic role reads nothing; an Operator reads it all.

do $$
declare
  v_tbl  text;
  v_seen integer;
begin
  if to_regclass('public.supplier') is null then return; end if;

  foreach v_tbl in array array[
    'supplier', 'supplier_contact', 'storage_location', 'stock_level',
    'inbound_receipt', 'inbound_receipt_line', 'pick_task', 'pick_task_line',
    'shipment', 'shipment_line', 'tracking_event',
    'return_authorization', 'return_authorization_line',
    'cycle_count', 'cycle_count_line', 'stock_adjustment'
  ] loop
    perform pg_temp.sign_in(3);
    execute format('select count(*) from public.%I', v_tbl) into v_seen;
    if v_seen <> 0 then
      raise exception 'a signed-in user with no role reads % row(s) of %', v_seen, v_tbl;
    end if;
  end loop;

  perform pg_temp.sign_in(2);
  if (select count(*) from public.supplier) = 0 or (select count(*) from public.stock_level) = 0 then
    raise exception 'an Operator cannot read suppliers or stock';
  end if;
end $$;

-- ── Suppliers: a Manager creates them, nobody else ───────────────────────────

do $$
declare
  v_locale bigint := (select id from public.locale where code = 'en');
  v_id     bigint;
  v_name   text;
begin
  if to_regclass('public.supplier') is null then return; end if;

  foreach v_id in array array[2, 3] loop
    perform pg_temp.sign_in(v_id::integer);
    begin
      perform public.logistic_create_supplier('rls-probe', 'Should Not Exist', v_locale, null);
      raise exception 'a user without supplier.create created a supplier';
    exception when insufficient_privilege then null;
    end;
  end loop;

  -- A Manager is not an administrator, and the supplier's name is copy, which only
  -- administrators write directly: the function writes it for them.
  perform pg_temp.sign_in(1);
  v_id := public.logistic_create_supplier('sql-check-supplier', 'SQL Check Co.', v_locale, 9);

  reset role;
  select t.content into v_name
  from public.local_text t
  join public.local_text_link l on l.id = t.link
  where l.slug = 'name' and l.scope = 'supplier' and l.entity_id = v_id and t.locale = v_locale;
  if v_name is distinct from 'SQL Check Co.' then
    raise exception 'created supplier has no name copy (got %)', coalesce(v_name, '<null>');
  end if;

  perform pg_temp.sign_in(1);
  begin
    perform public.logistic_create_supplier('sql-check-supplier', 'Duplicate', v_locale, null);
    raise exception 'a duplicate slug was accepted';
  exception when unique_violation then null;
  end;
end $$;

-- ── Stock moves only through checked functions (finding 4) ───────────────────

do $$
declare
  v_level   bigint;
  v_on_hand integer;
  v_refused boolean;
  v_fn      text;
begin
  if to_regclass('public.stock_level') is null then return; end if;

  -- The primitives are internal: nobody calls them through the API.
  foreach v_fn in array array[
    'public.logistic_adjust_stock(bigint, integer, public.stock_adjustment_reason, bigint, text)',
    'public.logistic_reserve_stock(bigint, integer)',
    'public.logistic_release_stock_reservation(bigint, integer)',
    'public.logistic_consume_stock(bigint, integer, public.stock_adjustment_reason, bigint, text)',
    'public.logistic_ensure_stock_level(bigint, text)'
  ] loop
    if has_function_privilege('authenticated', v_fn, 'EXECUTE')
       or has_function_privilege('anon', v_fn, 'EXECUTE') then
      raise exception '% is executable through the API', v_fn;
    end if;
  end loop;

  select id, on_hand into v_level, v_on_hand from public.stock_level order by id limit 1;
  if v_level is null then raise exception 'no stock_level rows seeded'; end if;

  -- An Operator may not adjust stock by hand; a Manager may, and the adjustment is theirs.
  perform pg_temp.sign_in(2);
  begin
    perform public.logistic_adjust_stock_level(v_level, 1000, 'other');
    raise exception 'an Operator adjusted stock by hand';
  exception when insufficient_privilege then null;
  end;

  perform pg_temp.sign_in(1);
  perform public.logistic_adjust_stock_level(v_level, 3, 'system_correction', 'sql-check');

  reset role;
  if (select on_hand from public.stock_level where id = v_level) <> v_on_hand + 3 then
    raise exception 'logistic_adjust_stock_level did not move on_hand';
  end if;
  if not exists (
    select 1 from public.stock_adjustment
    where stock_level_id = v_level and delta = 3 and note = 'sql-check'
      and on_hand_before = v_on_hand and on_hand_after = v_on_hand + 3
      and user_account_id = pg_temp.account_id(1)
  ) then
    raise exception 'the adjustment was not recorded against the Manager who made it';
  end if;

  -- The check constraints are the real guardrail: reserved may never exceed on_hand.
  v_refused := false;
  begin
    perform public.logistic_reserve_stock(v_level, 100000);
  exception when others then
    v_refused := true;
  end;
  if not v_refused then
    raise exception 'reserved more stock than exists';
  end if;
end $$;

-- ── Receiving: an Operator receives, and the receipt follows its lines ───────

do $$
declare
  v_bin     bigint;
  v_receipt bigint;
  v_line    bigint;
  v_level   bigint;
  v_before  integer;
  v_status  text;
begin
  if to_regclass('public.inbound_receipt') is null then return; end if;

  select id into v_bin from public.storage_location where location_type = 'bin' order by id limit 1;
  insert into public.inbound_receipt (supplier_id, user_account_id)
  values (null, pg_temp.account_id(1)) returning id into v_receipt;
  insert into public.inbound_receipt_line (inbound_receipt_id, storage_location_id, sku, expected_quantity)
  values (v_receipt, v_bin, 'SQLCHECK-001', 10) returning id into v_line;
  v_level := public.logistic_ensure_stock_level(v_bin, 'SQLCHECK-001');
  select on_hand into v_before from public.stock_level where id = v_level;

  perform pg_temp.sign_in(3);
  begin
    perform public.logistic_receive_receipt_line(v_line, 4);
    raise exception 'a user with no role received goods';
  exception when insufficient_privilege then null;
  end;

  perform pg_temp.sign_in(2);
  perform public.logistic_receive_receipt_line(v_line, 4);
  reset role;
  if (select on_hand from public.stock_level where id = v_level) <> v_before + 4 then
    raise exception 'receiving 4 did not move on_hand';
  end if;
  select status into v_status from public.inbound_receipt where id = v_receipt;
  if v_status <> 'partial' then
    raise exception 'partly received receipt should be partial, got %', v_status;
  end if;

  -- The delta is what moves, not the absolute quantity.
  perform pg_temp.sign_in(2);
  perform public.logistic_receive_receipt_line(v_line, 10);
  reset role;
  if (select on_hand from public.stock_level where id = v_level) <> v_before + 10 then
    raise exception 'receiving the rest moved the wrong delta';
  end if;
  select status into v_status from public.inbound_receipt where id = v_receipt;
  if v_status <> 'completed' then
    raise exception 'fully received receipt should be completed, got %', v_status;
  end if;

  -- A completed receipt is closed to the floor, and a refusal moves nothing.
  perform pg_temp.sign_in(2);
  begin
    perform public.logistic_receive_receipt_line(v_line, 2);
    raise exception 'an Operator received against a completed receipt';
  exception when insufficient_privilege then null;
  end;
  reset role;
  if (select on_hand from public.stock_level where id = v_level) <> v_before + 10 then
    raise exception 'a refused receive moved stock';
  end if;
  if (select user_account_id from public.stock_adjustment
      where stock_level_id = v_level and reason = 'inbound_receipt' order by id desc limit 1)
     <> pg_temp.account_id(2) then
    raise exception 'receiving was not recorded against the Operator who did it';
  end if;
end $$;

-- ── Picking: take, pick, complete; nobody else's task; no rewriting lines ────

do $$
declare
  v_bin      bigint;
  v_level    bigint;
  v_task     bigint;
  v_line     bigint;
  v_on_hand  integer;
  v_reserved integer;
  v_refused  boolean;
  v_rows     integer;
begin
  if to_regclass('public.pick_task') is null then return; end if;

  select id into v_bin from public.storage_location where location_type = 'bin' order by id limit 1;
  v_level := public.logistic_ensure_stock_level(v_bin, 'SQLCHECK-PICK');
  perform public.logistic_adjust_stock(v_level, 20, 'system_correction', pg_temp.account_id(1));
  perform public.logistic_reserve_stock(v_level, 8);
  insert into public.pick_task (user_account_id, status) values (null, 'open') returning id into v_task;
  insert into public.pick_task_line
    (pick_task_id, stock_level_id, storage_location_id, sku, requested_quantity, sequence)
  values (v_task, v_level, v_bin, 'SQLCHECK-PICK', 8, 10) returning id into v_line;
  select on_hand, reserved into v_on_hand, v_reserved from public.stock_level where id = v_level;

  perform pg_temp.sign_in(2);
  if not public.logistic_take_pick_task(v_task) then
    raise exception 'an Operator could not take an open task';
  end if;

  -- Finding 7: a picker changes how many were picked, never what was asked for.
  update public.pick_task_line set requested_quantity = 1 where id = v_line;
  get diagnostics v_rows = row_count;
  if v_rows <> 0 then raise exception 'an Operator rewrote a pick line''s requested quantity'; end if;

  perform public.logistic_record_picked_quantity(v_line, 5);
  reset role;
  if (select on_hand from public.stock_level where id = v_level) <> v_on_hand - 5 then
    raise exception 'picking 5 did not decrement on_hand';
  end if;
  if (select reserved from public.stock_level where id = v_level) <> v_reserved - 5 then
    raise exception 'picking 5 did not decrement reserved — the reservation is double-counting';
  end if;

  perform pg_temp.sign_in(2);
  perform public.logistic_record_picked_quantity(v_line, 3);
  v_refused := false;
  begin
    perform public.logistic_record_picked_quantity(v_line, 99);
  exception when raise_exception then
    v_refused := true;
  end;
  if not v_refused then raise exception 'picked more than the line requested'; end if;

  -- The Manager holds pick_task.pick too, but this task is the Operator's.
  perform pg_temp.sign_in(1);
  begin
    perform public.logistic_record_picked_quantity(v_line, 4);
    raise exception 'someone picked against a task taken by another';
  exception when insufficient_privilege then null;
  end;

  -- Completing short: 3 of 8 picked, so 5 come back off the reservation.
  perform pg_temp.sign_in(2);
  perform public.logistic_complete_pick_task(v_task);
  reset role;
  if (select status from public.pick_task where id = v_task) <> 'completed' then
    raise exception 'the task did not complete';
  end if;
  if (select reserved from public.stock_level where id = v_level) <> v_reserved - 8 then
    raise exception 'completing a short pick left stock reserved';
  end if;
  if (select on_hand from public.stock_level where id = v_level) <> v_on_hand - 3 then
    raise exception 'completing the task moved on_hand, which only picking should do';
  end if;
end $$;

-- ── Counting: an Operator counts, only a Manager approves ────────────────────

do $$
declare
  v_bin   bigint;
  v_count bigint;
  v_line  bigint;
  v_level bigint;
  v_before integer;
begin
  if to_regclass('public.cycle_count') is null then return; end if;

  select storage_location_id into v_bin from public.stock_level where on_hand > 0 order by id limit 1;

  perform pg_temp.sign_in(2);
  begin
    perform public.logistic_create_cycle_count(array[v_bin]);
    raise exception 'an Operator opened a cycle count';
  exception when insufficient_privilege then null;
  end;

  perform pg_temp.sign_in(1);
  v_count := public.logistic_create_cycle_count(array[v_bin]);

  perform pg_temp.sign_in(2);
  if not public.logistic_take_cycle_count(v_count) then
    raise exception 'an Operator could not take an open count';
  end if;

  reset role;
  select id, stock_level_id, expected_quantity into v_line, v_level, v_before
  from public.cycle_count_line where cycle_count_id = v_count order by id limit 1;

  perform pg_temp.sign_in(2);
  if not public.logistic_record_counted_quantity(v_count, v_line, v_before + 2) then
    raise exception 'an Operator could not record a count on their own count';
  end if;
  update public.cycle_count_line set expected_quantity = 0 where id = v_line;
  if (select expected_quantity from public.cycle_count_line where id = v_line) = 0 then
    raise exception 'an Operator rewrote what a count expected';
  end if;
  begin
    perform public.logistic_approve_cycle_count(v_count);
    raise exception 'an Operator approved a count';
  exception when insufficient_privilege then null;
  end;

  perform pg_temp.sign_in(1);
  perform public.logistic_approve_cycle_count(v_count);
  reset role;
  if (select status from public.cycle_count where id = v_count) <> 'completed' then
    raise exception 'the approved count is not completed';
  end if;
end $$;

-- ── Returns: an Operator grades and processes ────────────────────────────────

do $$
declare
  v_return bigint;
  v_line   bigint;
  v_bin    bigint;
begin
  if to_regclass('public.return_authorization') is null then return; end if;

  select id into v_bin from public.storage_location where location_type = 'bin' order by id limit 1;
  insert into public.return_authorization (user_account_id, status)
  values (pg_temp.account_id(1), 'pending') returning id into v_return;
  insert into public.return_authorization_line (return_authorization_id, sku, expected_quantity)
  values (v_return, 'SQLCHECK-RETURN', 2) returning id into v_line;

  perform pg_temp.sign_in(3);
  begin
    perform public.logistic_grade_return_line(v_line, 2, 'salable', 'restock', v_bin);
    raise exception 'a user with no role graded a return';
  exception when insufficient_privilege then null;
  end;

  perform pg_temp.sign_in(2);
  perform public.logistic_grade_return_line(v_line, 2, 'salable', 'restock', v_bin);
  perform public.logistic_process_return_authorization(v_return);
  reset role;
  if (select status from public.return_authorization where id = v_return) <> 'processed' then
    raise exception 'the return was not processed';
  end if;
end $$;

-- ── Cleanup ───────────────────────────────────────────────────────────────────

do $$
begin
  if to_regclass('public.supplier') is null then return; end if;
  delete from public.role_assignment
  where user_account_id in (pg_temp.account_id(1), pg_temp.account_id(2), pg_temp.account_id(3));
end $$;
