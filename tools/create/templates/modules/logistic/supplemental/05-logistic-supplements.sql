-- Logistic module supplements: cross-package FKs, updated_at triggers, PG functions, RLS policies
--
-- Policy conventions, matching superprototype's 03-base-rls.sql:
--   1. Helpers are called as `(select public.current_user_id())` /
--      `(select public.current_user_admin())`, never bare, so the planner hoists them
--      into an InitPlan evaluated once per statement instead of once per row.
--   2. Every policy names its roles with `to`, so a policy cannot silently apply to a
--      role nobody considered.
--   3. Admin gating goes through public.current_user_admin() rather than an inline
--      `exists (select 1 from public.user_account …)`, which would run as the caller and
--      so depend on user_account's own read policy staying as it is.
--
-- Rule 3 is the one with teeth here. The inline form these policies used until now
-- resolved only because user_account_owner_read admits exactly the row it asked for
-- (`(select public.current_user_id()) = id`); narrowing that policy later — gating it on
-- an active flag, say — would have made all 15 admin policies below deny admins, with
-- nothing to point at. The helper is SECURITY DEFINER and reads the table directly.
--
-- scripts/sql-check/20-assert-base.sql asserts the inline form is absent from every
-- policy in public, so this cannot drift back in unnoticed.
--
-- The access model (docs/ACCESS-CONTROL.md §7, A22): every table is governed by a permission
-- scope declared in this module's manifest — reading takes `<scope>.read`, writing the
-- scope's `create`, `update` or `delete` — and a document's lines follow the document. Nothing
-- is readable just for being signed in: Supabase signs up anyone with an email address, so
-- "authenticated" is the public (Clarion field test, findings 4, 5 and 7).
--
-- The warehouse work is verbs, each a SECURITY DEFINER function that checks its permission and
-- the document's state itself, and takes the acting user from the session, never a parameter:
-- receiving (`inbound_receipt.receive`), picking (`pick_task.pick`), counting
-- (`cycle_count.count`), grading and processing returns (`return_authorization.grade`),
-- approving a count (`cycle_count.approve`), and adjusting stock by hand
-- (`stock_level.adjust`). Stock moves only through the internal primitives those call, which
-- nobody may execute directly.

-- ── Cross-package foreign keys ───────────────────────────────────────────────
-- Wrapped in DO blocks so re-running sync:supabase doesn't fail on duplicate constraints.

do $$ begin
  alter table public.stock_adjustment
    add constraint fk_stock_adjustment_user_account
    foreign key (user_account_id) references public.user_account(id);
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.inbound_receipt
    add constraint fk_inbound_receipt_user_account
    foreign key (user_account_id) references public.user_account(id);
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.pick_task
    add constraint fk_pick_task_user_account
    foreign key (user_account_id) references public.user_account(id) on delete set null;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.shipment
    add constraint fk_shipment_user_account
    foreign key (user_account_id) references public.user_account(id);
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.return_authorization
    add constraint fk_return_authorization_user_account
    foreign key (user_account_id) references public.user_account(id);
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.cycle_count
    add constraint fk_cycle_count_user_account
    foreign key (user_account_id) references public.user_account(id);
exception when duplicate_object then null;
end $$;

-- ── updated_at triggers ───────────────────────────────────────────────────────

-- pg_catalog is always on the search_path regardless, so now() resolves with no
-- qualifying; this is fixed anyway so the trigger cannot be redirected either.
create or replace function public.set_updated_at()
returns trigger language plpgsql
set search_path = ''
as $$
begin new.updated_at = now(); return new; end; $$;

create or replace trigger stock_level_set_updated_at
  before update on public.stock_level
  for each row execute function public.set_updated_at();

create or replace trigger inbound_receipt_set_updated_at
  before update on public.inbound_receipt
  for each row execute function public.set_updated_at();

create or replace trigger pick_task_set_updated_at
  before update on public.pick_task
  for each row execute function public.set_updated_at();

create or replace trigger shipment_set_updated_at
  before update on public.shipment
  for each row execute function public.set_updated_at();

create or replace trigger return_authorization_set_updated_at
  before update on public.return_authorization
  for each row execute function public.set_updated_at();

create or replace trigger cycle_count_set_updated_at
  before update on public.cycle_count
  for each row execute function public.set_updated_at();

-- ── Stock primitives: internal ────────────────────────────────────────────────
--
-- The five functions that move stock. SECURITY DEFINER because stock_level is written by nobody
-- directly, and `set search_path = ''` with every reference schema-qualified, types and enum
-- casts included, because a definer function otherwise inherits the caller's search_path.
--
-- Internal: nobody may execute them, only the definer functions below, which run as the owner.
-- Until 2026-10 they were granted to every signed-in user, checked nothing, and took the actor
-- as a parameter, so anyone who signed up could set any stock level and sign the change as the
-- administrator (Clarion field test, finding 4). Each caller now checks its own permission and
-- passes current_user_id().

create or replace function public.logistic_adjust_stock(
  p_stock_level_id  bigint,
  p_delta           integer,
  p_reason          public.stock_adjustment_reason,
  p_user_account_id bigint,
  p_note            text default null
)
returns setof public.stock_adjustment
language plpgsql security definer
set search_path = ''
as $$
declare
  v_on_hand_before integer;
  v_on_hand_after  integer;
  v_adjustment     public.stock_adjustment;
begin
  select on_hand into v_on_hand_before from public.stock_level
  where id = p_stock_level_id for update;
  if not found then raise exception 'stock_level % not found', p_stock_level_id; end if;

  v_on_hand_after := v_on_hand_before + p_delta;
  if v_on_hand_after < 0 then
    raise exception 'insufficient stock: on_hand would be %', v_on_hand_after
      using errcode = '23514';
  end if;

  update public.stock_level set on_hand = v_on_hand_after where id = p_stock_level_id;

  insert into public.stock_adjustment (
    stock_level_id, user_account_id, delta, on_hand_before, on_hand_after, reason, note
  ) values (
    p_stock_level_id, p_user_account_id, p_delta, v_on_hand_before, v_on_hand_after, p_reason, p_note
  ) returning * into v_adjustment;

  return next v_adjustment;
end; $$;

create or replace function public.logistic_reserve_stock(
  p_stock_level_id bigint,
  p_quantity       integer
)
returns void language plpgsql security definer
set search_path = ''
as $$
declare v_on_hand integer; v_reserved integer;
begin
  select on_hand, reserved into v_on_hand, v_reserved
  from public.stock_level where id = p_stock_level_id for update;
  if not found then raise exception 'stock_level % not found', p_stock_level_id; end if;
  if v_reserved + p_quantity > v_on_hand then
    raise exception 'cannot reserve %: only % available', p_quantity, v_on_hand - v_reserved;
  end if;
  update public.stock_level set reserved = reserved + p_quantity where id = p_stock_level_id;
end; $$;

create or replace function public.logistic_release_stock_reservation(
  p_stock_level_id bigint,
  p_quantity       integer
)
returns void language plpgsql security definer
set search_path = ''
as $$
begin
  update public.stock_level
  set reserved = greatest(reserved - p_quantity, 0) where id = p_stock_level_id;
  if not found then raise exception 'stock_level % not found', p_stock_level_id; end if;
end; $$;

-- Physical pick of reserved stock: decrements on_hand AND reserved together so
-- the reserved <= on_hand invariant holds under concurrent tasks, and appends
-- the audit row. Negative p_quantity reverses a pick (both counters restored).
create or replace function public.logistic_consume_stock(
  p_stock_level_id  bigint,
  p_quantity        integer,
  p_reason          public.stock_adjustment_reason,
  p_user_account_id bigint,
  p_note            text default null
)
returns void language plpgsql security definer
set search_path = ''
as $$
declare
  v_on_hand  integer;
  v_reserved integer;
begin
  select on_hand, reserved into v_on_hand, v_reserved
  from public.stock_level where id = p_stock_level_id for update;
  if not found then raise exception 'stock_level % not found', p_stock_level_id; end if;
  if p_quantity > v_reserved then
    raise exception 'cannot consume %: only % reserved', p_quantity, v_reserved;
  end if;

  update public.stock_level
  set on_hand = on_hand - p_quantity, reserved = reserved - p_quantity
  where id = p_stock_level_id;

  insert into public.stock_adjustment (
    stock_level_id, user_account_id, delta, on_hand_before, on_hand_after, reason, note
  ) values (
    p_stock_level_id, p_user_account_id, -p_quantity, v_on_hand, v_on_hand - p_quantity, p_reason, p_note
  );
end; $$;

-- Finds or creates the stock_level row for a location + sku: receiving into a bin that has
-- never held the sku creates its row.
create or replace function public.logistic_ensure_stock_level(
  p_storage_location_id bigint,
  p_sku                 text
)
returns bigint language plpgsql security definer
set search_path = ''
as $$
declare v_id bigint;
begin
  insert into public.stock_level (storage_location_id, sku, on_hand, reserved)
  values (p_storage_location_id, p_sku, 0, 0)
  on conflict (storage_location_id, sku) do nothing;

  select id into v_id from public.stock_level
  where storage_location_id = p_storage_location_id and sku = p_sku;
  return v_id;
end; $$;

revoke execute on function
  public.logistic_adjust_stock(bigint, integer, public.stock_adjustment_reason, bigint, text)
  from public, anon, authenticated;
revoke execute on function public.logistic_reserve_stock(bigint, integer) from public, anon, authenticated;
revoke execute on function
  public.logistic_release_stock_reservation(bigint, integer) from public, anon, authenticated;
revoke execute on function
  public.logistic_consume_stock(bigint, integer, public.stock_adjustment_reason, bigint, text)
  from public, anon, authenticated;
revoke execute on function
  public.logistic_ensure_stock_level(bigint, text) from public, anon, authenticated;

-- ── The checks every verb starts with ─────────────────────────────────────────

-- Raises 42501 unless the current user may do `p_action` to every row of `p_scope`.
create or replace function public.logistic_require(p_scope text, p_action text)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if (select public.current_user_id()) is null
     or not (select public.current_user_can(p_scope, p_action)) then
    raise exception '%.% is required', p_scope, p_action using errcode = '42501';
  end if;
end;
$$;

revoke execute on function public.logistic_require(text, text) from public, anon, authenticated;

-- ── Adjusting stock by hand ───────────────────────────────────────────────────

-- A correction a person makes, with a reason, recorded against them.
create or replace function public.logistic_adjust_stock_level(
  p_stock_level_id bigint,
  p_delta          integer,
  p_reason         public.stock_adjustment_reason,
  p_note           text default null
)
returns setof public.stock_adjustment
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.logistic_require('stock_level', 'adjust');
  return query
  select * from public.logistic_adjust_stock(
    p_stock_level_id, p_delta, p_reason, (select public.current_user_id()), p_note
  );
end;
$$;

-- ── Creating documents ────────────────────────────────────────────────────────
--
-- SECURITY INVOKER where every statement is one the caller may make under RLS (a shipment and
-- its lines take `shipment.create`): these buy atomicity, not privilege. The creator is the
-- session's principal, never a parameter.
--
-- The supplier is SECURITY DEFINER, because its name is copy, and copy is written only by
-- administrators (00-local-text-rls.sql). It checks `supplier.create` itself, and writes only
-- this supplier's name.

create or replace function public.logistic_create_supplier(
  p_slug          text,
  p_name          text,
  p_locale_id     bigint,
  p_lead_time_day integer default null
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_supplier_id bigint;
  v_link_id     bigint;
begin
  perform public.logistic_require('supplier', 'create');

  if p_slug is null or btrim(p_slug) = '' then
    raise exception 'slug is required';
  end if;
  if p_name is null or btrim(p_name) = '' then
    raise exception 'name is required';
  end if;

  insert into public.supplier (slug, lead_time_day)
  values (btrim(p_slug), p_lead_time_day)
  returning id into v_supplier_id;

  -- Scope is the table name and entity_id the new row's id, per the i18n convention.
  insert into public.local_text_link (slug, scope, entity_id)
  values ('name', 'supplier', v_supplier_id)
  returning id into v_link_id;

  insert into public.local_text (link, locale, content)
  values (v_link_id, p_locale_id, btrim(p_name));

  return v_supplier_id;
end;
$$;

drop function if exists public.logistic_create_shipment(bigint, text[], integer[], text, text);

-- Arrays rather than one sku, following create_local_text_entry: the schema allows many
-- lines even though the create form offers one, and a signature shaped by today's form
-- would have to change the moment a shipment is built from a pick task.
create or replace function public.logistic_create_shipment(
  p_skus            text[],
  p_quantities      integer[],
  p_carrier         text default null,
  p_service_level   text default null
)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_shipment_id bigint;
begin
  if coalesce(array_length(p_skus, 1), 0) = 0 then
    raise exception 'a shipment needs at least one line';
  end if;
  if coalesce(array_length(p_skus, 1), 0) <> coalesce(array_length(p_quantities, 1), 0) then
    raise exception 'skus and quantities must have the same length';
  end if;

  insert into public.shipment (user_account_id, carrier, service_level, status)
  values (
    (select public.current_user_id()),
    nullif(btrim(coalesce(p_carrier, '')), ''),
    nullif(btrim(coalesce(p_service_level, '')), ''),
    'created'
  )
  returning id into v_shipment_id;

  insert into public.shipment_line (shipment_id, sku, quantity)
  select v_shipment_id, btrim(p_skus[i]), p_quantities[i]
  from generate_subscripts(p_skus, 1) as i;

  return v_shipment_id;
end;
$$;

drop function if exists public.logistic_create_return_authorization(bigint, text[], integer[], bigint, text, text);

create or replace function public.logistic_create_return_authorization(
  p_skus            text[],
  p_quantities      integer[],
  p_shipment_id     bigint default null,
  p_reason          text default null,
  p_note            text default null
)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_return_id bigint;
begin
  if coalesce(array_length(p_skus, 1), 0) = 0 then
    raise exception 'a return authorization needs at least one line';
  end if;
  if coalesce(array_length(p_skus, 1), 0) <> coalesce(array_length(p_quantities, 1), 0) then
    raise exception 'skus and quantities must have the same length';
  end if;

  insert into public.return_authorization (shipment_id, user_account_id, reason, note, status)
  values (
    p_shipment_id,
    (select public.current_user_id()),
    nullif(btrim(coalesce(p_reason, '')), ''),
    nullif(btrim(coalesce(p_note, '')), ''),
    'pending'
  )
  returning id into v_return_id;

  insert into public.return_authorization_line (return_authorization_id, sku, expected_quantity)
  select v_return_id, btrim(p_skus[i]), p_quantities[i]
  from generate_subscripts(p_skus, 1) as i;

  return v_return_id;
end;
$$;

drop function if exists public.logistic_create_cycle_count(bigint, bigint[]);

-- Opening a cycle count snapshots what the system currently believes is in each chosen
-- bin, so the count has something to be compared against. Two statements, and a count with
-- no lines is a count of nothing — there would be no way to add them afterwards.
--
-- The snapshot is the point: expected_quantity is on_hand *at the moment the count opens*,
-- so a later movement does not retroactively change what the counter was asked to verify.
-- SECURITY DEFINER because the snapshot reads stock_level, which the creator may not read; it
-- checks `cycle_count.create` itself.
create or replace function public.logistic_create_cycle_count(
  p_storage_location_ids bigint[]
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count_id bigint;
  v_lines    integer;
begin
  perform public.logistic_require('cycle_count', 'create');

  if coalesce(array_length(p_storage_location_ids, 1), 0) = 0 then
    raise exception 'a cycle count needs at least one storage location';
  end if;

  insert into public.cycle_count (user_account_id, status)
  values ((select public.current_user_id()), 'open')
  returning id into v_count_id;

  insert into public.cycle_count_line (
    cycle_count_id, stock_level_id, storage_location_id, sku, expected_quantity, counted_quantity
  )
  select v_count_id, sl.id, sl.storage_location_id, sl.sku, sl.on_hand, null
  from public.stock_level sl
  where sl.storage_location_id = any(p_storage_location_ids);

  get diagnostics v_lines = row_count;
  if v_lines = 0 then
    raise exception 'those locations hold no stock, so there is nothing to count';
  end if;

  return v_count_id;
end;
$$;

-- ── Receiving ─────────────────────────────────────────────────────────────────

drop function if exists public.logistic_receive_receipt_line(bigint, integer, bigint);

-- Receiving one line of an inbound receipt: five statements across three tables, and every
-- partial result is a real operational problem. Stock moved with the line not updated means the
-- next attempt receives it twice; the line updated with the receipt status stale means a
-- complete receipt still reads as pending.
--
-- Takes `inbound_receipt.receive`, on a receipt still pending or partial: a completed or
-- cancelled receipt is closed to the floor.
create or replace function public.logistic_receive_receipt_line(
  p_line_id           bigint,
  p_received_quantity integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_receipt_id     bigint;
  v_location_id    bigint;
  v_sku            text;
  v_previous       integer;
  v_status         public.inbound_receipt_status;
  v_delta          integer;
  v_stock_level_id bigint;
  v_all_complete   boolean;
  v_any_received   boolean;
begin
  perform public.logistic_require('inbound_receipt', 'receive');

  if p_received_quantity < 0 then
    raise exception 'received quantity cannot be negative';
  end if;

  select l.inbound_receipt_id, l.storage_location_id, l.sku, l.received_quantity, r.status
    into v_receipt_id, v_location_id, v_sku, v_previous, v_status
  from public.inbound_receipt_line l
  join public.inbound_receipt r on r.id = l.inbound_receipt_id
  where l.id = p_line_id
  for update of l;

  if not found then
    raise exception 'inbound_receipt_line % not found', p_line_id;
  end if;
  if v_status not in ('pending', 'partial') then
    raise exception 'this receipt is %, not open for receiving', v_status using errcode = '42501';
  end if;

  update public.inbound_receipt_line
  set received_quantity = p_received_quantity
  where id = p_line_id;

  v_delta := p_received_quantity - v_previous;
  if v_delta <> 0 then
    v_stock_level_id := public.logistic_ensure_stock_level(v_location_id, v_sku);
    perform public.logistic_adjust_stock(
      v_stock_level_id,
      v_delta,
      'inbound_receipt',
      (select public.current_user_id()),
      'Inbound receipt line ' || p_line_id
    );
  end if;

  -- The receipt's status is derived from its lines, so it is recomputed rather than
  -- advanced: receiving less than expected moves a complete receipt back to partial,
  -- which a one-way transition would get wrong.
  select
    count(*) > 0 and bool_and(received_quantity >= expected_quantity),
    bool_or(received_quantity > 0)
  into v_all_complete, v_any_received
  from public.inbound_receipt_line
  where inbound_receipt_id = v_receipt_id;

  update public.inbound_receipt
  set status = case
        when v_all_complete then 'completed'
        when v_any_received then 'partial'
        else 'pending'
      end::public.inbound_receipt_status,
      received_at = case when v_all_complete then now() else null end
  where id = v_receipt_id;
end;
$$;

-- ── Picking ───────────────────────────────────────────────────────────────────

-- Claims an open task for the caller. The `status = 'open'` predicate is what makes it safe when
-- two pickers press Take at once: the second update matches no row. False when someone else took
-- it first.
create or replace function public.logistic_take_pick_task(p_pick_task_id bigint)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_updated integer;
begin
  perform public.logistic_require('pick_task', 'pick');

  update public.pick_task
  set status = 'in_progress', user_account_id = (select public.current_user_id())
  where id = p_pick_task_id and status = 'open';

  get diagnostics v_updated = row_count;
  return v_updated > 0;
end;
$$;

drop function if exists public.logistic_record_picked_quantity(bigint, integer, bigint);

-- Recording a picked quantity: update the line and consume the stock physically taken. Only the
-- quantity picked changes: a picker cannot rewrite a line's requested quantity, its stock level
-- or its task (Clarion field test, finding 7), because nobody but a holder of `pick_task.update`
-- writes pick_task_line directly.
--
-- Consuming rather than adjusting is the distinction that matters: picking reserved stock
-- decrements on_hand AND reserved together, so the reserved <= on_hand invariant survives
-- concurrent tasks. A plain adjustment would drop on_hand and leave the reservation
-- standing, which then double-counts against the next picker.
create or replace function public.logistic_record_picked_quantity(
  p_line_id          bigint,
  p_picked_quantity  integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_stock_level_id bigint;
  v_requested      integer;
  v_previous       integer;
  v_delta          integer;
  v_status         public.pick_task_status;
  v_assignee       bigint;
begin
  perform public.logistic_require('pick_task', 'pick');

  select l.stock_level_id, l.requested_quantity, l.picked_quantity, t.status, t.user_account_id
    into v_stock_level_id, v_requested, v_previous, v_status, v_assignee
  from public.pick_task_line l
  join public.pick_task t on t.id = l.pick_task_id
  where l.id = p_line_id
  for update of l;

  if not found then
    raise exception 'pick_task_line % not found', p_line_id;
  end if;
  if v_status <> 'in_progress' or v_assignee is distinct from (select public.current_user_id()) then
    raise exception 'this task is not yours to pick, or is not in progress' using errcode = '42501';
  end if;

  -- More than requested is not an over-pick to be recorded, it is a mistake: the
  -- reservation only covers the requested quantity.
  if p_picked_quantity < 0 or p_picked_quantity > v_requested then
    raise exception 'picked quantity % is outside [0, %]', p_picked_quantity, v_requested;
  end if;

  update public.pick_task_line set picked_quantity = p_picked_quantity where id = p_line_id;

  v_delta := p_picked_quantity - v_previous;
  if v_delta <> 0 then
    perform public.logistic_consume_stock(
      v_stock_level_id,
      v_delta,
      'pick',
      (select public.current_user_id()),
      'Pick task line ' || p_line_id
    );
  end if;
end;
$$;

drop function if exists public.logistic_complete_pick_task(bigint, bigint);

-- Completing a pick task releases whatever was reserved but not picked, then closes the
-- task. Without the release, a short pick leaves stock reserved forever — invisible to
-- every other task, and impossible to reconcile after the fact.
create or replace function public.logistic_complete_pick_task(p_pick_task_id bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_line    record;
  v_updated integer;
begin
  perform public.logistic_require('pick_task', 'pick');

  update public.pick_task
  set status = 'completed'
  where id = p_pick_task_id
    and status = 'in_progress'
    and user_account_id = (select public.current_user_id());

  get diagnostics v_updated = row_count;
  if v_updated = 0 then
    raise exception 'this task is not yours to complete, or is not in progress'
      using errcode = '42501';
  end if;

  for v_line in
    select stock_level_id, requested_quantity - picked_quantity as unpicked
    from public.pick_task_line
    where pick_task_id = p_pick_task_id
      and requested_quantity > picked_quantity
  loop
    perform public.logistic_release_stock_reservation(v_line.stock_level_id, v_line.unpicked);
  end loop;
end;
$$;

-- ── Returns ───────────────────────────────────────────────────────────────────

drop function if exists public.logistic_grade_return_line(
  bigint, integer, public.return_condition, public.return_disposition, bigint, bigint
);

-- Grading one returned line: record what came back and, when it is salable enough to restock,
-- put it away. Takes `return_authorization.grade`, on a return still pending or received.
create or replace function public.logistic_grade_return_line(
  p_line_id             bigint,
  p_received_quantity   integer,
  p_condition           public.return_condition,
  p_disposition         public.return_disposition,
  p_storage_location_id bigint default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_sku            text;
  v_status         public.return_authorization_status;
  v_stock_level_id bigint;
begin
  perform public.logistic_require('return_authorization', 'grade');

  if p_received_quantity < 0 then
    raise exception 'received quantity cannot be negative';
  end if;
  -- Restocking without somewhere to put it would silently drop the goods, so this is a
  -- hard error rather than a skipped branch.
  if p_disposition = 'restock' and p_storage_location_id is null then
    raise exception 'a restock disposition needs a storage location';
  end if;

  select l.sku, r.status into v_sku, v_status
  from public.return_authorization_line l
  join public.return_authorization r on r.id = l.return_authorization_id
  where l.id = p_line_id
  for update of l;
  if not found then
    raise exception 'return_authorization_line % not found', p_line_id;
  end if;
  if v_status not in ('pending', 'received') then
    raise exception 'this return is %, not open for grading', v_status using errcode = '42501';
  end if;

  update public.return_authorization_line
  set received_quantity = p_received_quantity,
      condition = p_condition,
      disposition = p_disposition
  where id = p_line_id;

  -- Only a restock moves stock. Quarantine, scrap and refurbish are all recorded
  -- dispositions that deliberately leave sellable stock untouched.
  if p_disposition = 'restock' and p_received_quantity > 0 then
    v_stock_level_id := public.logistic_ensure_stock_level(p_storage_location_id, v_sku);
    perform public.logistic_adjust_stock(
      v_stock_level_id,
      p_received_quantity,
      'return_restock',
      (select public.current_user_id()),
      'Return authorization line ' || p_line_id || ' — restocked'
    );
  end if;
end;
$$;

-- Marking a return processed: bookkeeping, since every line's disposition has already moved
-- whatever stock it was going to. Takes `return_authorization.grade`, on an open return.
create or replace function public.logistic_process_return_authorization(p_return_authorization_id bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_updated integer;
begin
  perform public.logistic_require('return_authorization', 'grade');

  update public.return_authorization
  set status = 'processed'
  where id = p_return_authorization_id and status in ('pending', 'received');

  get diagnostics v_updated = row_count;
  if v_updated = 0 then
    raise exception 'this return is not open' using errcode = '42501';
  end if;
end;
$$;

-- ── Counting ──────────────────────────────────────────────────────────────────

-- Claims an open count for the caller, the same way a pick task is taken.
create or replace function public.logistic_take_cycle_count(p_cycle_count_id bigint)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_updated integer;
begin
  perform public.logistic_require('cycle_count', 'count');

  update public.cycle_count
  set status = 'in_progress', user_account_id = (select public.current_user_id())
  where id = p_cycle_count_id and status = 'open';

  get diagnostics v_updated = row_count;
  return v_updated > 0;
end;
$$;

-- Records what the counter saw on one line of a count they hold. Only the counted quantity
-- changes: a counter cannot move what the count expected. Moves no stock; the variance is
-- applied, all at once, when the count is approved. False when the line is not on that count.
create or replace function public.logistic_record_counted_quantity(
  p_cycle_count_id   bigint,
  p_line_id          bigint,
  p_counted_quantity integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_updated integer;
begin
  perform public.logistic_require('cycle_count', 'count');

  if p_counted_quantity < 0 then
    raise exception 'a counted quantity cannot be negative';
  end if;

  update public.cycle_count_line l
  set counted_quantity = p_counted_quantity
  from public.cycle_count c
  where l.id = p_line_id
    and l.cycle_count_id = p_cycle_count_id
    and c.id = l.cycle_count_id
    and c.status = 'in_progress'
    and c.user_account_id = (select public.current_user_id());

  get diagnostics v_updated = row_count;
  return v_updated > 0;
end;
$$;

drop function if exists public.logistic_approve_cycle_count(bigint, bigint);

-- Approving a count applies every variance it found and closes it. One adjustment per line
-- that differs, plus the status update — and a partly applied count is the worst possible
-- outcome, because the remaining variances are then invisible: the count reads as closed
-- while the stock it was meant to correct is still wrong. Takes `cycle_count.approve`.
create or replace function public.logistic_approve_cycle_count(p_cycle_count_id bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_line    record;
  v_updated integer;
begin
  perform public.logistic_require('cycle_count', 'approve');

  update public.cycle_count set status = 'completed'
  where id = p_cycle_count_id and status <> 'completed';

  get diagnostics v_updated = row_count;
  if v_updated = 0 then
    raise exception 'no open cycle count %', p_cycle_count_id using errcode = '42501';
  end if;

  -- An uncounted line is skipped rather than treated as zero: nobody counted it, which is
  -- not the same as finding none there.
  for v_line in
    select id, stock_level_id, counted_quantity - expected_quantity as delta
    from public.cycle_count_line
    where cycle_count_id = p_cycle_count_id
      and counted_quantity is not null
      and counted_quantity <> expected_quantity
  loop
    perform public.logistic_adjust_stock(
      v_line.stock_level_id,
      v_line.delta,
      'cycle_count_variance',
      (select public.current_user_id()),
      'Cycle count ' || p_cycle_count_id || ' — line ' || v_line.id
    );
  end loop;
end;
$$;

-- ── Execute privileges ────────────────────────────────────────────────────────
--
-- Stated, never inherited, and never to anon. Each function checks what its caller may do.

do $$
declare
  v_signature text;
begin
  foreach v_signature in array array[
    'public.logistic_adjust_stock_level(bigint, integer, public.stock_adjustment_reason, text)',
    'public.logistic_create_supplier(text, text, bigint, integer)',
    'public.logistic_create_shipment(text[], integer[], text, text)',
    'public.logistic_create_return_authorization(text[], integer[], bigint, text, text)',
    'public.logistic_create_cycle_count(bigint[])',
    'public.logistic_receive_receipt_line(bigint, integer)',
    'public.logistic_take_pick_task(bigint)',
    'public.logistic_record_picked_quantity(bigint, integer)',
    'public.logistic_complete_pick_task(bigint)',
    'public.logistic_grade_return_line(bigint, integer, public.return_condition, public.return_disposition, bigint)',
    'public.logistic_process_return_authorization(bigint)',
    'public.logistic_take_cycle_count(bigint)',
    'public.logistic_record_counted_quantity(bigint, bigint, integer)',
    'public.logistic_approve_cycle_count(bigint)'
  ] loop
    execute format('revoke execute on function %s from public, anon', v_signature);
    execute format('grant execute on function %s to authenticated', v_signature);
  end loop;
end $$;

-- ── Row level security ────────────────────────────────────────────────────────
--
-- Every table belongs to a permission scope of this module's manifest. A document's own table
-- takes the scope's `read`, `create`, `update` and `delete`; its lines (and a shipment's tracking
-- events, a supplier's contacts) follow the document, written with its `update`. Stock
-- adjustments are an audit trail: readable with `stock_level.read`, written only by the stock
-- primitives.
--
-- The policies these replace let any signed-in user read every table, and update receipts,
-- picks, returns and counts within their status windows (the worker policies). They are dropped
-- by name, so an upgraded database does not keep them beside these.

do $$
declare
  v_table text;
  v_old   text;
begin
  foreach v_table in array array[
    'storage_location', 'supplier', 'supplier_contact', 'stock_level', 'stock_adjustment',
    'inbound_receipt', 'inbound_receipt_line', 'pick_task', 'pick_task_line', 'shipment',
    'shipment_line', 'tracking_event', 'return_authorization', 'return_authorization_line',
    'cycle_count', 'cycle_count_line'
  ] loop
    execute format('alter table public.%I enable row level security', v_table);
    foreach v_old in array array['_read', '_admin', '_worker_update', '_insert'] loop
      execute format('drop policy if exists %I on public.%I', 'logistic_' || v_table || v_old, v_table);
    end loop;
  end loop;
end $$;

-- A document's own table, governed by its own scope.
do $$
declare
  v_table text;
begin
  foreach v_table in array array[
    'storage_location', 'supplier', 'stock_level', 'inbound_receipt', 'pick_task', 'shipment',
    'return_authorization', 'cycle_count'
  ] loop
    execute format(
      'create policy %I on public.%I for select to authenticated
         using ((select public.current_user_can(%L, %L)))',
      'logistic_' || v_table || '_read', v_table, v_table, 'read');

    execute format('drop policy if exists %I on public.%I', 'logistic_' || v_table || '_create', v_table);
    execute format(
      'create policy %I on public.%I for insert to authenticated
         with check ((select public.current_user_can(%L, %L)))',
      'logistic_' || v_table || '_create', v_table, v_table, 'create');

    execute format('drop policy if exists %I on public.%I', 'logistic_' || v_table || '_update', v_table);
    execute format(
      'create policy %I on public.%I for update to authenticated
         using ((select public.current_user_can(%L, %L)))
         with check ((select public.current_user_can(%L, %L)))',
      'logistic_' || v_table || '_update', v_table, v_table, 'update', v_table, 'update');

    execute format('drop policy if exists %I on public.%I', 'logistic_' || v_table || '_delete', v_table);
    execute format(
      'create policy %I on public.%I for delete to authenticated
         using ((select public.current_user_can(%L, %L)))',
      'logistic_' || v_table || '_delete', v_table, v_table, 'delete');
  end loop;
end $$;

-- A document's lines, following the document: read with its `read`, written with its `update`.
do $$
declare
  v_child  text;
  v_parent text;
  v_pair   text[];
begin
  foreach v_pair slice 1 in array array[
    array['supplier_contact', 'supplier'],
    array['inbound_receipt_line', 'inbound_receipt'],
    array['pick_task_line', 'pick_task'],
    array['shipment_line', 'shipment'],
    array['tracking_event', 'shipment'],
    array['return_authorization_line', 'return_authorization'],
    array['cycle_count_line', 'cycle_count']
  ] loop
    v_child := v_pair[1];
    v_parent := v_pair[2];
    execute format(
      'create policy %I on public.%I for select to authenticated
         using ((select public.current_user_can(%L, %L)))',
      'logistic_' || v_child || '_read', v_child, v_parent, 'read');

    execute format('drop policy if exists %I on public.%I', 'logistic_' || v_child || '_write', v_child);
    execute format(
      'create policy %I on public.%I for all to authenticated
         using ((select public.current_user_can(%L, %L)))
         with check ((select public.current_user_can(%L, %L)))',
      'logistic_' || v_child || '_write', v_child, v_parent, 'update', v_parent, 'update');
  end loop;
end $$;

-- The audit trail: readable with the stock it records, written by nobody directly.
create policy "logistic_stock_adjustment_read" on public.stock_adjustment for select to authenticated
  using ((select public.current_user_can('stock_level', 'read')));
