-- Logistic module supplements: cross-package FKs, updated_at triggers, PG functions, RLS policies
--
-- BEFORE → AFTER mapping for predicates:
--   user_account_id = auth.uid()  (uuid comparison)
--     → user_account_id = public.current_user_id()  (bigint comparison)
--   auth.jwt() ->> 'role' = 'admin'
--     → exists (select 1 from public.user_account where id = public.current_user_id() and admin)
--   p_user_account_id uuid  (function parameter type)
--     → p_user_account_id bigint

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

-- ── Atomic stock RPC functions ────────────────────────────────────────────────
-- p_user_account_id is bigint (was uuid) to align with user_account.id bigint PK.
--
-- All five are SECURITY DEFINER because stock_level writes are admin-only under RLS while
-- receiving, picking and counting are warehouse tasks. That makes `set search_path = ''`
-- mandatory, not optional: a definer function without it inherits the caller's
-- search_path and can be made to run a shadowed table or operator with the owner's
-- privileges. Every reference inside is therefore schema-qualified, types and enum casts
-- included — an unqualified `stock_adjustment` in a DECLARE does not resolve under an
-- empty search_path, which is how the omission first showed up: it broke composition from
-- a function that had been hardened.

create or replace function public.logistic_adjust_stock(
  p_stock_level_id  bigint,
  p_delta           integer,
  p_reason          public.adjustment_reason,
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
    raise exception 'insufficient stock: on_hand would be %', v_on_hand_after;
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
  p_reason          public.adjustment_reason,
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

-- Finds or creates the stock_level row for a location + sku. SECURITY DEFINER
-- because stock_level inserts are admin-only under RLS but workers receive goods.
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

-- These had no explicit grant and were relying on Postgres defaulting EXECUTE to PUBLIC.
-- Stated rather than inherited, and never to anon: every one of them writes stock.
grant execute on function
  public.logistic_adjust_stock(bigint, integer, public.adjustment_reason, bigint, text)
  to authenticated;
grant execute on function public.logistic_reserve_stock(bigint, integer) to authenticated;
grant execute on function
  public.logistic_release_stock_reservation(bigint, integer) to authenticated;
grant execute on function
  public.logistic_consume_stock(bigint, integer, public.adjustment_reason, bigint, text)
  to authenticated;
grant execute on function
  public.logistic_ensure_stock_level(bigint, text) to authenticated;

-- ── Compound admin writes ─────────────────────────────────────────────────────
--
-- SECURITY INVOKER, unlike the stock functions above: the body runs as the caller, so
-- every statement inside is still checked against this module's admin-write policies.
-- These buy atomicity, not privilege.
--
-- They exist because PostgREST has no client-side transactions and these entities carry
-- their name in the i18n tables rather than a column. Creating one is three statements —
-- the row, its local_text_link, its local_text — and any partial result is garbage: a
-- supplier with no name row renders the [missing: name] sentinel in every list that
-- shows it, and a link with no copy is invisible until something reads it.

create or replace function public.logistic_create_supplier(
  p_slug          text,
  p_name          text,
  p_locale_id     bigint,
  p_lead_time_day integer default null
)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_supplier_id bigint;
  v_link_id     bigint;
begin
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

create or replace function public.logistic_create_shipment(
  p_user_account_id bigint,
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
    p_user_account_id,
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

-- Arrays rather than one sku, following create_local_text_entry: the schema allows many
-- lines even though the create form offers one, and a signature shaped by today's form
-- would have to change the moment a shipment is built from a pick task.
grant execute on function
  public.logistic_create_shipment(bigint, text[], integer[], text, text) to authenticated;

create or replace function public.logistic_create_return_authorization(
  p_user_account_id bigint,
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
    p_user_account_id,
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

grant execute on function
  public.logistic_create_return_authorization(bigint, text[], integer[], bigint, text, text)
  to authenticated;

-- Grading one returned line: record what came back and, when it is salable enough to
-- restock, put it away. Two or four statements depending on the disposition, and a partial
-- result is stock added with no record of which line it came from.
--
-- SECURITY INVOKER for the same reason as receiving: the line update is what RLS governs,
-- while the stock movement goes through the SECURITY DEFINER helpers. And the same
-- ordering rule — the RLS-governed update first, its row count checked, so a refusal
-- aborts before anything is restocked.
create or replace function public.logistic_grade_return_line(
  p_line_id             bigint,
  p_received_quantity   integer,
  p_condition           public.return_condition,
  p_disposition         public.return_disposition,
  p_user_account_id     bigint,
  p_storage_location_id bigint default null
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_sku            text;
  v_stock_level_id bigint;
  v_updated        integer;
begin
  if p_received_quantity < 0 then
    raise exception 'received quantity cannot be negative';
  end if;
  -- Restocking without somewhere to put it would silently drop the goods, so this is a
  -- hard error rather than a skipped branch.
  if p_disposition = 'restock' and p_storage_location_id is null then
    raise exception 'a restock disposition needs a storage location';
  end if;

  select sku into v_sku from public.return_authorization_line where id = p_line_id;
  if not found then
    raise exception 'return_authorization_line % not found', p_line_id;
  end if;

  update public.return_authorization_line
  set received_quantity = p_received_quantity,
      condition = p_condition,
      disposition = p_disposition
  where id = p_line_id;

  get diagnostics v_updated = row_count;
  if v_updated = 0 then
    raise exception insufficient_privilege
      using message = 'not permitted to grade this return line';
  end if;

  -- Only a restock moves stock. Quarantine, scrap and refurbish are all recorded
  -- dispositions that deliberately leave sellable stock untouched.
  if p_disposition = 'restock' and p_received_quantity > 0 then
    v_stock_level_id := public.logistic_ensure_stock_level(p_storage_location_id, v_sku);
    perform public.logistic_adjust_stock(
      v_stock_level_id,
      p_received_quantity,
      'return_restock',
      p_user_account_id,
      'Return authorization line ' || p_line_id || ' — restocked'
    );
  end if;
end;
$$;

grant execute on function
  public.logistic_grade_return_line(
    bigint, integer, public.return_condition, public.return_disposition, bigint, bigint
  ) to authenticated;

-- Receiving one line of an inbound receipt: five statements across three tables, and
-- every partial result is a real operational problem. Stock moved with the line not
-- updated means the next attempt receives it twice; the line updated with the receipt
-- status stale means a complete receipt still reads as pending.
--
-- SECURITY INVOKER, so whether this caller may touch this receipt at all is decided by
-- the RLS policies on inbound_receipt_line and inbound_receipt — including the worker
-- policy that permits only receipts still pending or partial. The stock movement inside
-- goes through the SECURITY DEFINER helpers above, which is the split that matters:
-- stock_level writes are admin-only under RLS but receiving is a warehouse task.
--
-- Statement order is load-bearing. Under RLS a forbidden UPDATE affects zero rows rather
-- than raising, so the line update comes first and its row count is checked: a refusal
-- then aborts before any stock has moved. Doing it the other way round would move stock
-- and silently fail to record it.
create or replace function public.logistic_receive_receipt_line(
  p_line_id           bigint,
  p_received_quantity integer,
  p_user_account_id   bigint
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_receipt_id     bigint;
  v_location_id    bigint;
  v_sku            text;
  v_previous       integer;
  v_delta          integer;
  v_stock_level_id bigint;
  v_updated        integer;
  v_all_complete   boolean;
  v_any_received   boolean;
begin
  if p_received_quantity < 0 then
    raise exception 'received quantity cannot be negative';
  end if;

  select inbound_receipt_id, storage_location_id, sku, received_quantity
    into v_receipt_id, v_location_id, v_sku, v_previous
  from public.inbound_receipt_line
  where id = p_line_id;

  if not found then
    raise exception 'inbound_receipt_line % not found', p_line_id;
  end if;

  update public.inbound_receipt_line
  set received_quantity = p_received_quantity
  where id = p_line_id;

  get diagnostics v_updated = row_count;
  if v_updated = 0 then
    -- Zero rows here is RLS refusing, not a missing row: the select above found it.
    raise exception insufficient_privilege
      using message = 'not permitted to receive against this receipt';
  end if;

  v_delta := p_received_quantity - v_previous;
  if v_delta <> 0 then
    v_stock_level_id := public.logistic_ensure_stock_level(v_location_id, v_sku);
    perform public.logistic_adjust_stock(
      v_stock_level_id,
      v_delta,
      'inbound_receipt',
      p_user_account_id,
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
        when v_all_complete then 'complete'
        when v_any_received then 'partial'
        else 'pending'
      end::public.inbound_receipt_status,
      received_at = case when v_all_complete then now() else null end
  where id = v_receipt_id;
end;
$$;

-- Receiving is a warehouse task, so this one goes to authenticated and RLS decides the
-- rest. anon gets nothing.
grant execute on function
  public.logistic_receive_receipt_line(bigint, integer, bigint) to authenticated;

-- Matches the convention in superprototype's 04-admin-write-rpc.sql: an admin-write
-- RPC is granted to authenticated and never to anon. RLS still decides whether the
-- caller may actually touch the rows.
grant execute on function
  public.logistic_create_supplier(text, text, bigint, integer) to authenticated;

-- ── RLS policies ─────────────────────────────────────────────────────────────

alter table public.storage_location enable row level security;
drop policy if exists "logistic_storage_location_read" on public.storage_location;
create policy "logistic_storage_location_read" on public.storage_location for select to authenticated using (true);
drop policy if exists "logistic_storage_location_admin" on public.storage_location;
create policy "logistic_storage_location_admin" on public.storage_location for all to authenticated
  using (exists (select 1 from public.user_account where id = public.current_user_id() and admin))
  with check (exists (select 1 from public.user_account where id = public.current_user_id() and admin));

alter table public.supplier enable row level security;
drop policy if exists "logistic_supplier_read" on public.supplier;
create policy "logistic_supplier_read" on public.supplier for select to authenticated using (true);
drop policy if exists "logistic_supplier_admin" on public.supplier;
create policy "logistic_supplier_admin" on public.supplier for all to authenticated
  using (exists (select 1 from public.user_account where id = public.current_user_id() and admin))
  with check (exists (select 1 from public.user_account where id = public.current_user_id() and admin));

alter table public.supplier_contact enable row level security;
drop policy if exists "logistic_supplier_contact_read" on public.supplier_contact;
create policy "logistic_supplier_contact_read" on public.supplier_contact for select to authenticated using (true);
drop policy if exists "logistic_supplier_contact_admin" on public.supplier_contact;
create policy "logistic_supplier_contact_admin" on public.supplier_contact for all to authenticated
  using (exists (select 1 from public.user_account where id = public.current_user_id() and admin))
  with check (exists (select 1 from public.user_account where id = public.current_user_id() and admin));

alter table public.stock_level enable row level security;
drop policy if exists "logistic_stock_level_read" on public.stock_level;
create policy "logistic_stock_level_read" on public.stock_level for select to authenticated using (true);
drop policy if exists "logistic_stock_level_admin" on public.stock_level;
create policy "logistic_stock_level_admin" on public.stock_level for all to authenticated
  using (exists (select 1 from public.user_account where id = public.current_user_id() and admin))
  with check (exists (select 1 from public.user_account where id = public.current_user_id() and admin));

alter table public.stock_adjustment enable row level security;
drop policy if exists "logistic_stock_adjustment_read" on public.stock_adjustment;
create policy "logistic_stock_adjustment_read" on public.stock_adjustment for select to authenticated using (true);
drop policy if exists "logistic_stock_adjustment_insert" on public.stock_adjustment;
-- Adjustments must be attributed to the acting user. (The SECURITY DEFINER
-- stock functions bypass this; it guards the direct-insert path.)
create policy "logistic_stock_adjustment_insert" on public.stock_adjustment for insert to authenticated
  with check (user_account_id = public.current_user_id());

alter table public.inbound_receipt enable row level security;
drop policy if exists "logistic_inbound_receipt_read" on public.inbound_receipt;
create policy "logistic_inbound_receipt_read" on public.inbound_receipt for select to authenticated using (true);
drop policy if exists "logistic_inbound_receipt_admin" on public.inbound_receipt;
create policy "logistic_inbound_receipt_admin" on public.inbound_receipt for all to authenticated
  using (exists (select 1 from public.user_account where id = public.current_user_id() and admin))
  with check (exists (select 1 from public.user_account where id = public.current_user_id() and admin));
drop policy if exists "logistic_inbound_receipt_worker_update" on public.inbound_receipt;
-- Workers may only touch receipts that are still open, and may only move them
-- forward within the receiving lifecycle (cancellation is admin-only).
create policy "logistic_inbound_receipt_worker_update" on public.inbound_receipt for update to authenticated
  using (status in ('pending', 'partial'))
  with check (status in ('pending', 'partial', 'complete'));

alter table public.inbound_receipt_line enable row level security;
drop policy if exists "logistic_inbound_receipt_line_read" on public.inbound_receipt_line;
create policy "logistic_inbound_receipt_line_read" on public.inbound_receipt_line for select to authenticated using (true);
drop policy if exists "logistic_inbound_receipt_line_admin" on public.inbound_receipt_line;
create policy "logistic_inbound_receipt_line_admin" on public.inbound_receipt_line for all to authenticated
  using (exists (select 1 from public.user_account where id = public.current_user_id() and admin))
  with check (exists (select 1 from public.user_account where id = public.current_user_id() and admin));
drop policy if exists "logistic_inbound_receipt_line_worker_update" on public.inbound_receipt_line;
create policy "logistic_inbound_receipt_line_worker_update" on public.inbound_receipt_line for update to authenticated
  using (exists (
    select 1 from public.inbound_receipt r
    where r.id = inbound_receipt_id and r.status in ('pending', 'partial')
  ))
  with check (true);

alter table public.pick_task enable row level security;
drop policy if exists "logistic_pick_task_read" on public.pick_task;
create policy "logistic_pick_task_read" on public.pick_task for select to authenticated using (true);
drop policy if exists "logistic_pick_task_admin" on public.pick_task;
create policy "logistic_pick_task_admin" on public.pick_task for all to authenticated
  using (exists (select 1 from public.user_account where id = public.current_user_id() and admin))
  with check (exists (select 1 from public.user_account where id = public.current_user_id() and admin));
drop policy if exists "logistic_pick_task_worker_update" on public.pick_task;
create policy "logistic_pick_task_worker_update" on public.pick_task for update to authenticated
  using (status = 'open' or user_account_id = public.current_user_id())
  with check (user_account_id = public.current_user_id());

alter table public.pick_task_line enable row level security;
drop policy if exists "logistic_pick_task_line_read" on public.pick_task_line;
create policy "logistic_pick_task_line_read" on public.pick_task_line for select to authenticated using (true);
drop policy if exists "logistic_pick_task_line_admin" on public.pick_task_line;
create policy "logistic_pick_task_line_admin" on public.pick_task_line for all to authenticated
  using (exists (select 1 from public.user_account where id = public.current_user_id() and admin))
  with check (exists (select 1 from public.user_account where id = public.current_user_id() and admin));
drop policy if exists "logistic_pick_task_line_worker_update" on public.pick_task_line;
create policy "logistic_pick_task_line_worker_update" on public.pick_task_line for update to authenticated
  using (exists (select 1 from public.pick_task t where t.id = pick_task_id and t.user_account_id = public.current_user_id()))
  with check (true);

alter table public.shipment enable row level security;
drop policy if exists "logistic_shipment_read" on public.shipment;
create policy "logistic_shipment_read" on public.shipment for select to authenticated using (true);
drop policy if exists "logistic_shipment_admin" on public.shipment;
create policy "logistic_shipment_admin" on public.shipment for all to authenticated
  using (exists (select 1 from public.user_account where id = public.current_user_id() and admin))
  with check (exists (select 1 from public.user_account where id = public.current_user_id() and admin));

alter table public.shipment_line enable row level security;
drop policy if exists "logistic_shipment_line_read" on public.shipment_line;
create policy "logistic_shipment_line_read" on public.shipment_line for select to authenticated using (true);
drop policy if exists "logistic_shipment_line_admin" on public.shipment_line;
create policy "logistic_shipment_line_admin" on public.shipment_line for all to authenticated
  using (exists (select 1 from public.user_account where id = public.current_user_id() and admin))
  with check (exists (select 1 from public.user_account where id = public.current_user_id() and admin));

alter table public.tracking_event enable row level security;
drop policy if exists "logistic_tracking_event_read" on public.tracking_event;
create policy "logistic_tracking_event_read" on public.tracking_event for select to authenticated using (true);
drop policy if exists "logistic_tracking_event_admin" on public.tracking_event;
create policy "logistic_tracking_event_admin" on public.tracking_event for all to authenticated
  using (exists (select 1 from public.user_account where id = public.current_user_id() and admin))
  with check (exists (select 1 from public.user_account where id = public.current_user_id() and admin));

alter table public.return_authorization enable row level security;
drop policy if exists "logistic_return_authorization_read" on public.return_authorization;
create policy "logistic_return_authorization_read" on public.return_authorization for select to authenticated using (true);
drop policy if exists "logistic_return_authorization_admin" on public.return_authorization;
create policy "logistic_return_authorization_admin" on public.return_authorization for all to authenticated
  using (exists (select 1 from public.user_account where id = public.current_user_id() and admin))
  with check (exists (select 1 from public.user_account where id = public.current_user_id() and admin));
drop policy if exists "logistic_return_authorization_worker_update" on public.return_authorization;
-- Workers may only touch open returns; cancellation is admin-only.
create policy "logistic_return_authorization_worker_update" on public.return_authorization for update to authenticated
  using (status in ('pending', 'received'))
  with check (status in ('pending', 'received', 'processed'));

alter table public.return_authorization_line enable row level security;
drop policy if exists "logistic_return_authorization_line_read" on public.return_authorization_line;
create policy "logistic_return_authorization_line_read" on public.return_authorization_line for select to authenticated using (true);
drop policy if exists "logistic_return_authorization_line_admin" on public.return_authorization_line;
create policy "logistic_return_authorization_line_admin" on public.return_authorization_line for all to authenticated
  using (exists (select 1 from public.user_account where id = public.current_user_id() and admin))
  with check (exists (select 1 from public.user_account where id = public.current_user_id() and admin));
drop policy if exists "logistic_return_authorization_line_worker_update" on public.return_authorization_line;
create policy "logistic_return_authorization_line_worker_update" on public.return_authorization_line for update to authenticated
  using (exists (
    select 1 from public.return_authorization ra
    where ra.id = return_authorization_id and ra.status in ('pending', 'received')
  ))
  with check (true);

alter table public.cycle_count enable row level security;
drop policy if exists "logistic_cycle_count_read" on public.cycle_count;
create policy "logistic_cycle_count_read" on public.cycle_count for select to authenticated using (true);
drop policy if exists "logistic_cycle_count_admin" on public.cycle_count;
create policy "logistic_cycle_count_admin" on public.cycle_count for all to authenticated
  using (exists (select 1 from public.user_account where id = public.current_user_id() and admin))
  with check (exists (select 1 from public.user_account where id = public.current_user_id() and admin));
drop policy if exists "logistic_cycle_count_worker_update" on public.cycle_count;
-- Mirrors pick_task: workers may claim open counts, then only the assignee
-- may keep updating.
create policy "logistic_cycle_count_worker_update" on public.cycle_count for update to authenticated
  using (status = 'open' or user_account_id = public.current_user_id())
  with check (user_account_id = public.current_user_id());

alter table public.cycle_count_line enable row level security;
drop policy if exists "logistic_cycle_count_line_read" on public.cycle_count_line;
create policy "logistic_cycle_count_line_read" on public.cycle_count_line for select to authenticated using (true);
drop policy if exists "logistic_cycle_count_line_admin" on public.cycle_count_line;
create policy "logistic_cycle_count_line_admin" on public.cycle_count_line for all to authenticated
  using (exists (select 1 from public.user_account where id = public.current_user_id() and admin))
  with check (exists (select 1 from public.user_account where id = public.current_user_id() and admin));
drop policy if exists "logistic_cycle_count_line_worker_update" on public.cycle_count_line;
create policy "logistic_cycle_count_line_worker_update" on public.cycle_count_line for update to authenticated
  using (exists (select 1 from public.cycle_count c where c.id = cycle_count_id and c.user_account_id = public.current_user_id()))
  with check (true);
