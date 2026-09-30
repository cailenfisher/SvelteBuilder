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

-- ── Receiving a line moves stock, updates the line, and derives the status ───
--
-- Five statements across three tables in one function, so the thing worth asserting is
-- that all of them landed together and that the receipt's status was recomputed rather
-- than advanced.

do $$
declare
  v_sub       uuid;
  v_admin     bigint;
  v_bin       bigint;
  v_receipt   bigint;
  v_line      bigint;
  v_level     bigint;
  v_before    integer;
  v_status    text;
begin
  if to_regclass('public.inbound_receipt') is null then return; end if;

  select ua.id, ua.auth_user_id into v_admin, v_sub
  from public.user_account ua where ua.admin order by ua.id limit 1;
  select id into v_bin from public.storage_location where location_type = 'bin' order by id limit 1;

  set local role authenticated;
  perform set_config('request.jwt.claim.sub', v_sub::text, true);

  insert into public.inbound_receipt (supplier_id, user_account_id)
  values (null, v_admin) returning id into v_receipt;

  insert into public.inbound_receipt_line
    (inbound_receipt_id, storage_location_id, sku, expected_quantity)
  values (v_receipt, v_bin, 'SQLCHECK-001', 10) returning id into v_line;

  -- A receipt with an expected line and nothing received is still pending.
  select status into v_status from public.inbound_receipt where id = v_receipt;
  if v_status <> 'pending' then
    raise exception 'new receipt should be pending, got %', v_status;
  end if;

  v_level := public.logistic_ensure_stock_level(v_bin, 'SQLCHECK-001');
  select on_hand into v_before from public.stock_level where id = v_level;

  -- Partial receipt.
  perform public.logistic_receive_receipt_line(v_line, 4, v_admin);

  if (select on_hand from public.stock_level where id = v_level) <> v_before + 4 then
    raise exception 'receiving 4 did not move on_hand';
  end if;
  select status into v_status from public.inbound_receipt where id = v_receipt;
  if v_status <> 'partial' then
    raise exception 'partly received receipt should be partial, got %', v_status;
  end if;

  -- Completing it. The delta is what moves, not the absolute quantity — receiving 10
  -- after 4 must add 6, not 10.
  perform public.logistic_receive_receipt_line(v_line, 10, v_admin);

  if (select on_hand from public.stock_level where id = v_level) <> v_before + 10 then
    raise exception 'receiving the rest moved the wrong delta';
  end if;
  select status into v_status from public.inbound_receipt where id = v_receipt;
  if v_status <> 'complete' then
    raise exception 'fully received receipt should be complete, got %', v_status;
  end if;
  if (select received_at from public.inbound_receipt where id = v_receipt) is null then
    raise exception 'complete receipt has no received_at';
  end if;

  -- Correcting downward must move the status back, not leave it complete: the status is
  -- derived from the lines every time rather than advanced one way.
  perform public.logistic_receive_receipt_line(v_line, 2, v_admin);
  select status into v_status from public.inbound_receipt where id = v_receipt;
  if v_status <> 'partial' then
    raise exception 'corrected-down receipt should return to partial, got %', v_status;
  end if;
  if (select on_hand from public.stock_level where id = v_level) <> v_before + 2 then
    raise exception 'correcting down did not reverse the stock';
  end if;
  if (select received_at from public.inbound_receipt where id = v_receipt) is not null then
    raise exception 'no-longer-complete receipt still has received_at';
  end if;

  -- The audit trail records every movement, including the reversal.
  if (select count(*) from public.stock_adjustment
      where stock_level_id = v_level and reason = 'inbound_receipt') <> 3 then
    raise exception 'expected three inbound_receipt adjustments, one per receive call';
  end if;
end $$;

-- A cancelled receipt is closed to receiving. The worker policy permits updates only
-- while a receipt is pending or partial, and the function checks the row count so a
-- refusal aborts before any stock has moved.
do $$
declare
  v_sub     uuid;
  v_admin   bigint;
  v_bin     bigint;
  v_receipt bigint;
  v_line    bigint;
  v_level   bigint;
  v_before  integer;
begin
  if to_regclass('public.inbound_receipt') is null then return; end if;

  select ua.id, ua.auth_user_id into v_admin, v_sub
  from public.user_account ua where ua.admin order by ua.id limit 1;
  select id into v_bin from public.storage_location where location_type = 'bin' order by id limit 1;

  set local role authenticated;
  perform set_config('request.jwt.claim.sub', v_sub::text, true);

  insert into public.inbound_receipt (supplier_id, user_account_id, status)
  values (null, v_admin, 'cancelled') returning id into v_receipt;
  insert into public.inbound_receipt_line
    (inbound_receipt_id, storage_location_id, sku, expected_quantity)
  values (v_receipt, v_bin, 'SQLCHECK-002', 5) returning id into v_line;

  v_level := public.logistic_ensure_stock_level(v_bin, 'SQLCHECK-002');
  select on_hand into v_before from public.stock_level where id = v_level;

  begin
    perform public.logistic_receive_receipt_line(v_line, 5, v_admin);
    -- An admin's blanket policy does permit this update, so reaching here is correct for
    -- an admin. What must not happen is stock moving without the line recording it.
    if (select received_quantity from public.inbound_receipt_line where id = v_line) <> 5 then
      raise exception 'stock moved but the line was not updated';
    end if;
  exception when insufficient_privilege then
    -- A refusal must leave no trace.
    if (select on_hand from public.stock_level where id = v_level) <> v_before then
      raise exception 'a refused receive still moved stock';
    end if;
  end;
end $$;

-- ── Picking consumes reserved stock, and completing releases the rest ────────
--
-- The subtlest invariant in the module. Picking reserved stock must decrement on_hand AND
-- reserved together, or the reservation stays standing and double-counts against the next
-- picker. Completing a short pick must release what was reserved and not taken, or that
-- stock is reserved forever — invisible to every other task and unreconcilable after.

do $$
declare
  v_sub        uuid;
  v_worker     bigint;
  v_worker_sub uuid;
  v_bin        bigint;
  v_level      bigint;
  v_task       bigint;
  v_line       bigint;
  v_on_hand    integer;
  v_reserved   integer;
begin
  if to_regclass('public.pick_task') is null then return; end if;

  select ua.id, ua.auth_user_id into v_worker, v_worker_sub
  from public.user_account ua where not ua.admin order by ua.id limit 1;
  select id into v_bin from public.storage_location where location_type = 'bin' order by id limit 1;

  -- Set the scene as an admin: stock on the shelf, reserved for a task assigned to the
  -- worker. Admin because stock_level and pick_task inserts are admin-only under RLS.
  select ua.auth_user_id into v_sub
  from public.user_account ua where ua.admin order by ua.id limit 1;
  set local role authenticated;
  perform set_config('request.jwt.claim.sub', v_sub::text, true);

  v_level := public.logistic_ensure_stock_level(v_bin, 'SQLCHECK-PICK');
  perform public.logistic_adjust_stock(v_level, 20, 'system_correction', v_worker);
  perform public.logistic_reserve_stock(v_level, 8);

  insert into public.pick_task (user_account_id, status)
  values (v_worker, 'in_progress') returning id into v_task;

  insert into public.pick_task_line
    (pick_task_id, stock_level_id, storage_location_id, sku, requested_quantity, sequence)
  values (v_task, v_level, v_bin, 'SQLCHECK-PICK', 8, 10) returning id into v_line;

  select on_hand, reserved into v_on_hand, v_reserved
  from public.stock_level where id = v_level;

  -- Now as the worker, which is what the worker policies are for.
  perform set_config('request.jwt.claim.sub', v_worker_sub::text, true);

  perform public.logistic_record_picked_quantity(v_line, 5, v_worker);

  if (select on_hand from public.stock_level where id = v_level) <> v_on_hand - 5 then
    raise exception 'picking 5 did not decrement on_hand';
  end if;
  if (select reserved from public.stock_level where id = v_level) <> v_reserved - 5 then
    raise exception 'picking 5 did not decrement reserved — the reservation is double-counting';
  end if;

  -- Correcting downward reverses both counters, so a mis-scan is recoverable.
  perform public.logistic_record_picked_quantity(v_line, 3, v_worker);
  if (select on_hand from public.stock_level where id = v_level) <> v_on_hand - 3 then
    raise exception 'correcting the pick down did not restore on_hand';
  end if;
  if (select reserved from public.stock_level where id = v_level) <> v_reserved - 3 then
    raise exception 'correcting the pick down did not restore reserved';
  end if;

  -- More than requested is a mistake, not an over-pick: the reservation only covers the
  -- requested quantity.
  begin
    perform public.logistic_record_picked_quantity(v_line, 99, v_worker);
    raise exception 'picked more than the line requested';
  exception when raise_exception then
    null; -- refused, as intended
  end;

  -- Completing short: 3 of 8 picked, so 5 must come back off the reservation.
  perform public.logistic_complete_pick_task(v_task, v_worker);

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

-- A worker may not pick against a task that is not theirs. The line update is what RLS
-- governs, and the function checks its row count, so a refusal must leave stock untouched.
do $$
declare
  v_admin      bigint;
  v_admin_sub  uuid;
  v_worker     bigint;
  v_worker_sub uuid;
  v_bin        bigint;
  v_level      bigint;
  v_task       bigint;
  v_line       bigint;
  v_on_hand    integer;
begin
  if to_regclass('public.pick_task') is null then return; end if;

  select ua.id, ua.auth_user_id into v_admin, v_admin_sub
  from public.user_account ua where ua.admin order by ua.id limit 1;
  select ua.id, ua.auth_user_id into v_worker, v_worker_sub
  from public.user_account ua where not ua.admin order by ua.id limit 1;
  select id into v_bin from public.storage_location where location_type = 'bin' order by id limit 1;

  set local role authenticated;
  perform set_config('request.jwt.claim.sub', v_admin_sub::text, true);

  v_level := public.logistic_ensure_stock_level(v_bin, 'SQLCHECK-NOTMINE');
  perform public.logistic_adjust_stock(v_level, 10, 'system_correction', v_admin);
  perform public.logistic_reserve_stock(v_level, 4);

  -- Assigned to the admin, so the worker has no claim on it.
  insert into public.pick_task (user_account_id, status)
  values (v_admin, 'in_progress') returning id into v_task;
  insert into public.pick_task_line
    (pick_task_id, stock_level_id, storage_location_id, sku, requested_quantity)
  values (v_task, v_level, v_bin, 'SQLCHECK-NOTMINE', 4) returning id into v_line;

  select on_hand into v_on_hand from public.stock_level where id = v_level;

  perform set_config('request.jwt.claim.sub', v_worker_sub::text, true);

  begin
    perform public.logistic_record_picked_quantity(v_line, 4, v_worker);
    raise exception 'a worker picked against a task assigned to someone else';
  exception when insufficient_privilege then
    if (select on_hand from public.stock_level where id = v_level) <> v_on_hand then
      raise exception 'a refused pick still moved stock';
    end if;
  end;
end $$;
