-- =============================================================================
-- @sveltebuilder/logistic — DDL
-- 010_logistic.sql
--
-- Naming conventions: singular snake_case tables, bigint identity PK, <table>_id FKs,
-- _at timestamp suffixes, no is_/has_ boolean prefixes.
--
-- i18n convention: domain entities with user-facing names carry NO copy fields.
-- All display names are linked via hermes local_text_link / local_text system:
--   slug = 'name', scope = table name, entity_id = bigint PK of the entity.
-- Callers resolve via: localText('name', 'supplier', supplier.id)
--
-- SCOPE DEVIATIONS (documented at table definition):
--   supplier_contact.name — a person's actual name, not editorial copy.
--     Stored as plain text. Not translated. Same pattern as blog comment.body.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type storage_location_type as enum ('warehouse', 'zone', 'aisle', 'bin');

create type adjustment_reason as enum (
  'damage',
  'theft',
  'receiving_error',
  'cycle_count_variance',
  'system_correction',
  'other'
);

create type inbound_receipt_status as enum ('pending', 'partial', 'complete', 'cancelled');

create type pick_task_status as enum ('open', 'in_progress', 'completed', 'cancelled');

create type shipment_status as enum (
  'created',
  'packed',
  'dispatched',
  'in_transit',
  'delivered',
  'exception'
);

create type return_condition as enum ('salable', 'damaged', 'defective', 'wrong_item');

create type return_disposition as enum ('restock', 'quarantine', 'scrap', 'refurbish');

create type return_authorization_status as enum ('pending', 'received', 'processed', 'cancelled');

create type cycle_count_status as enum ('open', 'in_progress', 'complete', 'cancelled');

-- ---------------------------------------------------------------------------
-- Updated-at trigger (reuse if already defined by another module)
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- storage_location
--
-- Self-referential tree: any depth hierarchy (warehouse → zone → aisle → bin).
-- slug: URL-safe routing key, locale-independent.
-- Display name linked via hermes: localText('name', 'storage_location', id)
-- ---------------------------------------------------------------------------
create table public.storage_location (
  id                           bigint generated always as identity primary key,
  slug                         text not null unique,
  location_type                storage_location_type not null,
  parent_storage_location_id   bigint references public.storage_location(id) on delete set null,
  active                       boolean not null default true,
  sort_order                   integer not null default 0,
  created_at                   timestamptz not null default now()
);

alter table public.storage_location enable row level security;

create policy "logistic_storage_location_read"
  on public.storage_location for select
  to authenticated
  using (true);

create policy "logistic_storage_location_admin"
  on public.storage_location for all
  to authenticated
  using (auth.jwt() ->> 'role' = 'admin')
  with check (auth.jwt() ->> 'role' = 'admin');

create index idx_storage_location_parent on public.storage_location(parent_storage_location_id);
create index idx_storage_location_type   on public.storage_location(location_type);

-- ---------------------------------------------------------------------------
-- supplier
--
-- slug: URL-safe routing key, locale-independent.
-- Display name linked via hermes: localText('name', 'supplier', id)
-- ---------------------------------------------------------------------------
create table public.supplier (
  id             bigint generated always as identity primary key,
  slug           text not null unique,
  lead_time_day  integer,
  active         boolean not null default true,
  created_at     timestamptz not null default now()
);

alter table public.supplier enable row level security;

create policy "logistic_supplier_read"
  on public.supplier for select
  to authenticated
  using (true);

create policy "logistic_supplier_admin"
  on public.supplier for all
  to authenticated
  using (auth.jwt() ->> 'role' = 'admin')
  with check (auth.jwt() ->> 'role' = 'admin');

-- ---------------------------------------------------------------------------
-- supplier_contact
--
-- SCOPE DEVIATION: name is a person's actual name, not editorial copy.
-- Stored as plain text, not linked via local_text. Not translated.
-- ---------------------------------------------------------------------------
create table public.supplier_contact (
  id           bigint generated always as identity primary key,
  supplier_id  bigint not null references public.supplier(id) on delete cascade,
  role         text not null,
  name         text not null,
  email        text,
  phone        text,
  created_at   timestamptz not null default now()
);

alter table public.supplier_contact enable row level security;

create policy "logistic_supplier_contact_read"
  on public.supplier_contact for select
  to authenticated
  using (true);

create policy "logistic_supplier_contact_admin"
  on public.supplier_contact for all
  to authenticated
  using (auth.jwt() ->> 'role' = 'admin')
  with check (auth.jwt() ->> 'role' = 'admin');

create index idx_supplier_contact_supplier on public.supplier_contact(supplier_id);

-- ---------------------------------------------------------------------------
-- stock_level
--
-- Tracks current inventory quantities per (location, SKU) pair.
-- available = on_hand - reserved (always derived, never stored).
-- Mutations must go through logistic_adjust_stock() or logistic_reserve_stock()
-- to ensure atomicity and audit trail via stock_adjustment.
-- ---------------------------------------------------------------------------
create table public.stock_level (
  id                   bigint generated always as identity primary key,
  storage_location_id  bigint not null references public.storage_location(id),
  sku                  text not null,
  on_hand              integer not null default 0,
  reserved             integer not null default 0,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (storage_location_id, sku),
  constraint stock_on_hand_non_negative   check (on_hand >= 0),
  constraint stock_reserved_non_negative  check (reserved >= 0),
  constraint stock_reserved_lte_on_hand   check (reserved <= on_hand)
);

create trigger stock_level_set_updated_at
  before update on public.stock_level
  for each row execute function set_updated_at();

alter table public.stock_level enable row level security;

create policy "logistic_stock_level_read"
  on public.stock_level for select
  to authenticated
  using (true);

create policy "logistic_stock_level_admin"
  on public.stock_level for all
  to authenticated
  using (auth.jwt() ->> 'role' = 'admin')
  with check (auth.jwt() ->> 'role' = 'admin');

create index idx_stock_level_location on public.stock_level(storage_location_id);
create index idx_stock_level_sku      on public.stock_level(sku);

-- ---------------------------------------------------------------------------
-- stock_adjustment
--
-- Append-only audit log of every stock mutation. Never updated or deleted.
-- on_hand_before + delta = on_hand_after (enforced at application layer via RPC).
-- ---------------------------------------------------------------------------
create table public.stock_adjustment (
  id               bigint generated always as identity primary key,
  stock_level_id   bigint not null references public.stock_level(id),
  user_account_id  uuid not null references public.user_account(id),
  delta            integer not null,
  on_hand_before   integer not null,
  on_hand_after    integer not null,
  reason           adjustment_reason not null,
  note             text,
  created_at       timestamptz not null default now()
);

alter table public.stock_adjustment enable row level security;

create policy "logistic_stock_adjustment_read"
  on public.stock_adjustment for select
  to authenticated
  using (true);

create policy "logistic_stock_adjustment_insert"
  on public.stock_adjustment for insert
  to authenticated
  with check (true);

-- Adjustments are immutable once written.

create index idx_stock_adjustment_stock_level on public.stock_adjustment(stock_level_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Postgres RPC functions for atomic stock operations
-- ---------------------------------------------------------------------------

-- logistic_adjust_stock: atomically records a stock adjustment and updates on_hand.
create or replace function logistic_adjust_stock(
  p_stock_level_id  bigint,
  p_delta           integer,
  p_reason          adjustment_reason,
  p_user_account_id uuid,
  p_note            text default null
)
returns setof stock_adjustment
language plpgsql
security definer
as $$
declare
  v_on_hand_before integer;
  v_on_hand_after  integer;
  v_adjustment     stock_adjustment;
begin
  select on_hand into v_on_hand_before
  from public.stock_level
  where id = p_stock_level_id
  for update;

  if not found then
    raise exception 'stock_level % not found', p_stock_level_id;
  end if;

  v_on_hand_after := v_on_hand_before + p_delta;

  if v_on_hand_after < 0 then
    raise exception 'insufficient stock: on_hand would be %', v_on_hand_after;
  end if;

  update public.stock_level
  set on_hand = v_on_hand_after
  where id = p_stock_level_id;

  insert into public.stock_adjustment (
    stock_level_id, user_account_id, delta,
    on_hand_before, on_hand_after, reason, note
  )
  values (
    p_stock_level_id, p_user_account_id, p_delta,
    v_on_hand_before, v_on_hand_after, p_reason, p_note
  )
  returning * into v_adjustment;

  return next v_adjustment;
end;
$$;

-- logistic_reserve_stock: atomically increments the reserved counter.
create or replace function logistic_reserve_stock(
  p_stock_level_id bigint,
  p_quantity       integer
)
returns void
language plpgsql
security definer
as $$
declare
  v_on_hand integer;
  v_reserved integer;
begin
  select on_hand, reserved into v_on_hand, v_reserved
  from public.stock_level
  where id = p_stock_level_id
  for update;

  if not found then
    raise exception 'stock_level % not found', p_stock_level_id;
  end if;

  if v_reserved + p_quantity > v_on_hand then
    raise exception 'cannot reserve %: only % available (on_hand=%, reserved=%)',
      p_quantity, v_on_hand - v_reserved, v_on_hand, v_reserved;
  end if;

  update public.stock_level
  set reserved = reserved + p_quantity
  where id = p_stock_level_id;
end;
$$;

-- logistic_release_stock_reservation: atomically decrements reserved counter.
create or replace function logistic_release_stock_reservation(
  p_stock_level_id bigint,
  p_quantity       integer
)
returns void
language plpgsql
security definer
as $$
begin
  update public.stock_level
  set reserved = greatest(reserved - p_quantity, 0)
  where id = p_stock_level_id;

  if not found then
    raise exception 'stock_level % not found', p_stock_level_id;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- inbound_receipt
-- ---------------------------------------------------------------------------
create table public.inbound_receipt (
  id               bigint generated always as identity primary key,
  supplier_id      bigint not null references public.supplier(id),
  user_account_id  uuid not null references public.user_account(id),
  status           inbound_receipt_status not null default 'pending',
  expected_at      timestamptz,
  received_at      timestamptz,
  note             text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create trigger inbound_receipt_set_updated_at
  before update on public.inbound_receipt
  for each row execute function set_updated_at();

alter table public.inbound_receipt enable row level security;

create policy "logistic_inbound_receipt_read"
  on public.inbound_receipt for select
  to authenticated
  using (true);

create policy "logistic_inbound_receipt_admin"
  on public.inbound_receipt for all
  to authenticated
  using (auth.jwt() ->> 'role' = 'admin')
  with check (auth.jwt() ->> 'role' = 'admin');

-- Workers may update receipts (status changes during receiving)
create policy "logistic_inbound_receipt_worker_update"
  on public.inbound_receipt for update
  to authenticated
  using (true)
  with check (true);

create index idx_inbound_receipt_supplier on public.inbound_receipt(supplier_id);
create index idx_inbound_receipt_status   on public.inbound_receipt(status, created_at desc);

-- ---------------------------------------------------------------------------
-- inbound_receipt_line
--
-- discrepancy is a generated column: received_quantity - expected_quantity.
-- Negative = short shipment. Positive = over-shipment.
-- ---------------------------------------------------------------------------
create table public.inbound_receipt_line (
  id                   bigint generated always as identity primary key,
  inbound_receipt_id   bigint not null references public.inbound_receipt(id) on delete cascade,
  storage_location_id  bigint not null references public.storage_location(id),
  sku                  text not null,
  expected_quantity    integer not null,
  received_quantity    integer not null default 0,
  discrepancy          integer generated always as (received_quantity - expected_quantity) stored,
  created_at           timestamptz not null default now()
);

alter table public.inbound_receipt_line enable row level security;

create policy "logistic_inbound_receipt_line_read"
  on public.inbound_receipt_line for select
  to authenticated
  using (true);

create policy "logistic_inbound_receipt_line_admin"
  on public.inbound_receipt_line for all
  to authenticated
  using (auth.jwt() ->> 'role' = 'admin')
  with check (auth.jwt() ->> 'role' = 'admin');

create policy "logistic_inbound_receipt_line_worker_update"
  on public.inbound_receipt_line for update
  to authenticated
  using (true)
  with check (true);

create index idx_inbound_receipt_line_receipt on public.inbound_receipt_line(inbound_receipt_id);

-- ---------------------------------------------------------------------------
-- pick_task
-- ---------------------------------------------------------------------------
create table public.pick_task (
  id               bigint generated always as identity primary key,
  user_account_id  uuid references public.user_account(id) on delete set null,
  status           pick_task_status not null default 'open',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create trigger pick_task_set_updated_at
  before update on public.pick_task
  for each row execute function set_updated_at();

alter table public.pick_task enable row level security;

create policy "logistic_pick_task_read"
  on public.pick_task for select
  to authenticated
  using (true);

create policy "logistic_pick_task_admin"
  on public.pick_task for all
  to authenticated
  using (auth.jwt() ->> 'role' = 'admin')
  with check (auth.jwt() ->> 'role' = 'admin');

-- Workers can take open tasks (assign themselves) or update their own tasks
create policy "logistic_pick_task_worker_update"
  on public.pick_task for update
  to authenticated
  using (status = 'open' or user_account_id = auth.uid())
  with check (user_account_id = auth.uid());

create index idx_pick_task_status         on public.pick_task(status, created_at desc);
create index idx_pick_task_user_account   on public.pick_task(user_account_id);

-- ---------------------------------------------------------------------------
-- pick_task_line
-- ---------------------------------------------------------------------------
create table public.pick_task_line (
  id                   bigint generated always as identity primary key,
  pick_task_id         bigint not null references public.pick_task(id) on delete cascade,
  stock_level_id       bigint not null references public.stock_level(id),
  storage_location_id  bigint not null references public.storage_location(id),
  sku                  text not null,
  requested_quantity   integer not null,
  picked_quantity      integer not null default 0,
  created_at           timestamptz not null default now()
);

alter table public.pick_task_line enable row level security;

create policy "logistic_pick_task_line_read"
  on public.pick_task_line for select
  to authenticated
  using (true);

create policy "logistic_pick_task_line_admin"
  on public.pick_task_line for all
  to authenticated
  using (auth.jwt() ->> 'role' = 'admin')
  with check (auth.jwt() ->> 'role' = 'admin');

-- Workers can update lines on their own tasks
create policy "logistic_pick_task_line_worker_update"
  on public.pick_task_line for update
  to authenticated
  using (
    exists (
      select 1 from public.pick_task t
      where t.id = pick_task_id and t.user_account_id = auth.uid()
    )
  )
  with check (true);

create index idx_pick_task_line_task on public.pick_task_line(pick_task_id);

-- ---------------------------------------------------------------------------
-- shipment
-- ---------------------------------------------------------------------------
create table public.shipment (
  id               bigint generated always as identity primary key,
  user_account_id  uuid not null references public.user_account(id),
  status           shipment_status not null default 'created',
  carrier          text,
  service_level    text,
  tracking_number  text,
  shipped_at       timestamptz,
  delivered_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create trigger shipment_set_updated_at
  before update on public.shipment
  for each row execute function set_updated_at();

alter table public.shipment enable row level security;

create policy "logistic_shipment_read"
  on public.shipment for select
  to authenticated
  using (true);

create policy "logistic_shipment_admin"
  on public.shipment for all
  to authenticated
  using (auth.jwt() ->> 'role' = 'admin')
  with check (auth.jwt() ->> 'role' = 'admin');

create index idx_shipment_status          on public.shipment(status, created_at desc);
create index idx_shipment_tracking_number on public.shipment(tracking_number) where tracking_number is not null;

-- ---------------------------------------------------------------------------
-- shipment_line
-- ---------------------------------------------------------------------------
create table public.shipment_line (
  id                  bigint generated always as identity primary key,
  shipment_id         bigint not null references public.shipment(id) on delete cascade,
  pick_task_line_id   bigint references public.pick_task_line(id) on delete set null,
  sku                 text not null,
  quantity            integer not null,
  created_at          timestamptz not null default now()
);

alter table public.shipment_line enable row level security;

create policy "logistic_shipment_line_read"
  on public.shipment_line for select
  to authenticated
  using (true);

create policy "logistic_shipment_line_admin"
  on public.shipment_line for all
  to authenticated
  using (auth.jwt() ->> 'role' = 'admin')
  with check (auth.jwt() ->> 'role' = 'admin');

create index idx_shipment_line_shipment on public.shipment_line(shipment_id);

-- ---------------------------------------------------------------------------
-- tracking_event
-- ---------------------------------------------------------------------------
create table public.tracking_event (
  id              bigint generated always as identity primary key,
  shipment_id     bigint not null references public.shipment(id) on delete cascade,
  status          text not null,
  event_location  text,
  description     text,
  occurred_at     timestamptz not null default now(),
  created_at      timestamptz not null default now()
);

alter table public.tracking_event enable row level security;

create policy "logistic_tracking_event_read"
  on public.tracking_event for select
  to authenticated
  using (true);

create policy "logistic_tracking_event_admin"
  on public.tracking_event for all
  to authenticated
  using (auth.jwt() ->> 'role' = 'admin')
  with check (auth.jwt() ->> 'role' = 'admin');

create index idx_tracking_event_shipment on public.tracking_event(shipment_id, occurred_at asc);

-- ---------------------------------------------------------------------------
-- return_authorization
-- ---------------------------------------------------------------------------
create table public.return_authorization (
  id               bigint generated always as identity primary key,
  shipment_id      bigint references public.shipment(id) on delete set null,
  user_account_id  uuid not null references public.user_account(id),
  status           return_authorization_status not null default 'pending',
  reason           text,
  note             text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create trigger return_authorization_set_updated_at
  before update on public.return_authorization
  for each row execute function set_updated_at();

alter table public.return_authorization enable row level security;

create policy "logistic_return_authorization_read"
  on public.return_authorization for select
  to authenticated
  using (true);

create policy "logistic_return_authorization_admin"
  on public.return_authorization for all
  to authenticated
  using (auth.jwt() ->> 'role' = 'admin')
  with check (auth.jwt() ->> 'role' = 'admin');

-- Workers may update returns (receiving + grading)
create policy "logistic_return_authorization_worker_update"
  on public.return_authorization for update
  to authenticated
  using (true)
  with check (true);

create index idx_return_authorization_status   on public.return_authorization(status, created_at desc);
create index idx_return_authorization_shipment on public.return_authorization(shipment_id);

-- ---------------------------------------------------------------------------
-- return_authorization_line
--
-- condition and disposition are null until the item is physically received
-- and graded by a warehouse worker.
-- ---------------------------------------------------------------------------
create table public.return_authorization_line (
  id                         bigint generated always as identity primary key,
  return_authorization_id    bigint not null references public.return_authorization(id) on delete cascade,
  shipment_line_id           bigint references public.shipment_line(id) on delete set null,
  sku                        text not null,
  expected_quantity          integer not null,
  received_quantity          integer not null default 0,
  condition                  return_condition,
  disposition                return_disposition,
  created_at                 timestamptz not null default now()
);

alter table public.return_authorization_line enable row level security;

create policy "logistic_return_authorization_line_read"
  on public.return_authorization_line for select
  to authenticated
  using (true);

create policy "logistic_return_authorization_line_admin"
  on public.return_authorization_line for all
  to authenticated
  using (auth.jwt() ->> 'role' = 'admin')
  with check (auth.jwt() ->> 'role' = 'admin');

create policy "logistic_return_authorization_line_worker_update"
  on public.return_authorization_line for update
  to authenticated
  using (true)
  with check (true);

create index idx_return_authorization_line_return on public.return_authorization_line(return_authorization_id);

-- ---------------------------------------------------------------------------
-- cycle_count
-- ---------------------------------------------------------------------------
create table public.cycle_count (
  id               bigint generated always as identity primary key,
  user_account_id  uuid not null references public.user_account(id),
  status           cycle_count_status not null default 'open',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create trigger cycle_count_set_updated_at
  before update on public.cycle_count
  for each row execute function set_updated_at();

alter table public.cycle_count enable row level security;

create policy "logistic_cycle_count_read"
  on public.cycle_count for select
  to authenticated
  using (true);

create policy "logistic_cycle_count_admin"
  on public.cycle_count for all
  to authenticated
  using (auth.jwt() ->> 'role' = 'admin')
  with check (auth.jwt() ->> 'role' = 'admin');

-- Workers assigned to the count can update it
create policy "logistic_cycle_count_worker_update"
  on public.cycle_count for update
  to authenticated
  using (user_account_id = auth.uid())
  with check (user_account_id = auth.uid());

create index idx_cycle_count_status on public.cycle_count(status, created_at desc);

-- ---------------------------------------------------------------------------
-- cycle_count_line
--
-- variance is a generated column: counted_quantity - expected_quantity.
-- Null until counted. Negative = fewer than expected. Positive = overage.
-- ---------------------------------------------------------------------------
create table public.cycle_count_line (
  id                   bigint generated always as identity primary key,
  cycle_count_id       bigint not null references public.cycle_count(id) on delete cascade,
  stock_level_id       bigint not null references public.stock_level(id),
  storage_location_id  bigint not null references public.storage_location(id),
  sku                  text not null,
  expected_quantity    integer not null,
  counted_quantity     integer,
  variance             integer generated always as (counted_quantity - expected_quantity) stored,
  created_at           timestamptz not null default now()
);

alter table public.cycle_count_line enable row level security;

create policy "logistic_cycle_count_line_read"
  on public.cycle_count_line for select
  to authenticated
  using (true);

create policy "logistic_cycle_count_line_admin"
  on public.cycle_count_line for all
  to authenticated
  using (auth.jwt() ->> 'role' = 'admin')
  with check (auth.jwt() ->> 'role' = 'admin');

create policy "logistic_cycle_count_line_worker_update"
  on public.cycle_count_line for update
  to authenticated
  using (
    exists (
      select 1 from public.cycle_count c
      where c.id = cycle_count_id and c.user_account_id = auth.uid()
    )
  )
  with check (true);

create index idx_cycle_count_line_count on public.cycle_count_line(cycle_count_id);
