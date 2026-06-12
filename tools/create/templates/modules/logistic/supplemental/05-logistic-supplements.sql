-- Logistic module supplements: cross-package FKs, updated_at triggers, PG functions, RLS policies

-- ── Cross-package foreign keys ───────────────────────────────────────────────

alter table public.stock_adjustment
  add constraint fk_stock_adjustment_user_account
  foreign key (user_account_id) references public.user_account(id);

alter table public.inbound_receipt
  add constraint fk_inbound_receipt_user_account
  foreign key (user_account_id) references public.user_account(id);

alter table public.pick_task
  add constraint fk_pick_task_user_account
  foreign key (user_account_id) references public.user_account(id) on delete set null;

alter table public.shipment
  add constraint fk_shipment_user_account
  foreign key (user_account_id) references public.user_account(id);

alter table public.return_authorization
  add constraint fk_return_authorization_user_account
  foreign key (user_account_id) references public.user_account(id);

alter table public.cycle_count
  add constraint fk_cycle_count_user_account
  foreign key (user_account_id) references public.user_account(id);

-- ── updated_at triggers ───────────────────────────────────────────────────────
-- set_updated_at() function is created by blog-supplements or standalone below.

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger stock_level_set_updated_at
  before update on public.stock_level
  for each row execute function set_updated_at();

create trigger inbound_receipt_set_updated_at
  before update on public.inbound_receipt
  for each row execute function set_updated_at();

create trigger pick_task_set_updated_at
  before update on public.pick_task
  for each row execute function set_updated_at();

create trigger shipment_set_updated_at
  before update on public.shipment
  for each row execute function set_updated_at();

create trigger return_authorization_set_updated_at
  before update on public.return_authorization
  for each row execute function set_updated_at();

create trigger cycle_count_set_updated_at
  before update on public.cycle_count
  for each row execute function set_updated_at();

-- ── Atomic stock RPC functions ────────────────────────────────────────────────

create or replace function logistic_adjust_stock(
  p_stock_level_id  bigint,
  p_delta           integer,
  p_reason          adjustment_reason,
  p_user_account_id uuid,
  p_note            text default null
)
returns setof stock_adjustment
language plpgsql security definer
as $$
declare
  v_on_hand_before integer;
  v_on_hand_after  integer;
  v_adjustment     stock_adjustment;
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

create or replace function logistic_reserve_stock(
  p_stock_level_id bigint,
  p_quantity       integer
)
returns void language plpgsql security definer
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

create or replace function logistic_release_stock_reservation(
  p_stock_level_id bigint,
  p_quantity       integer
)
returns void language plpgsql security definer
as $$
begin
  update public.stock_level
  set reserved = greatest(reserved - p_quantity, 0) where id = p_stock_level_id;
  if not found then raise exception 'stock_level % not found', p_stock_level_id; end if;
end; $$;

-- ── RLS policies ─────────────────────────────────────────────────────────────

alter table public.storage_location enable row level security;
create policy "logistic_storage_location_read" on public.storage_location for select to authenticated using (true);
create policy "logistic_storage_location_admin" on public.storage_location for all to authenticated using (auth.jwt() ->> 'role' = 'admin') with check (auth.jwt() ->> 'role' = 'admin');

alter table public.supplier enable row level security;
create policy "logistic_supplier_read" on public.supplier for select to authenticated using (true);
create policy "logistic_supplier_admin" on public.supplier for all to authenticated using (auth.jwt() ->> 'role' = 'admin') with check (auth.jwt() ->> 'role' = 'admin');

alter table public.supplier_contact enable row level security;
create policy "logistic_supplier_contact_read" on public.supplier_contact for select to authenticated using (true);
create policy "logistic_supplier_contact_admin" on public.supplier_contact for all to authenticated using (auth.jwt() ->> 'role' = 'admin') with check (auth.jwt() ->> 'role' = 'admin');

alter table public.stock_level enable row level security;
create policy "logistic_stock_level_read" on public.stock_level for select to authenticated using (true);
create policy "logistic_stock_level_admin" on public.stock_level for all to authenticated using (auth.jwt() ->> 'role' = 'admin') with check (auth.jwt() ->> 'role' = 'admin');

alter table public.stock_adjustment enable row level security;
create policy "logistic_stock_adjustment_read" on public.stock_adjustment for select to authenticated using (true);
create policy "logistic_stock_adjustment_insert" on public.stock_adjustment for insert to authenticated with check (true);

alter table public.inbound_receipt enable row level security;
create policy "logistic_inbound_receipt_read" on public.inbound_receipt for select to authenticated using (true);
create policy "logistic_inbound_receipt_admin" on public.inbound_receipt for all to authenticated using (auth.jwt() ->> 'role' = 'admin') with check (auth.jwt() ->> 'role' = 'admin');
create policy "logistic_inbound_receipt_worker_update" on public.inbound_receipt for update to authenticated using (true) with check (true);

alter table public.inbound_receipt_line enable row level security;
create policy "logistic_inbound_receipt_line_read" on public.inbound_receipt_line for select to authenticated using (true);
create policy "logistic_inbound_receipt_line_admin" on public.inbound_receipt_line for all to authenticated using (auth.jwt() ->> 'role' = 'admin') with check (auth.jwt() ->> 'role' = 'admin');
create policy "logistic_inbound_receipt_line_worker_update" on public.inbound_receipt_line for update to authenticated using (true) with check (true);

alter table public.pick_task enable row level security;
create policy "logistic_pick_task_read" on public.pick_task for select to authenticated using (true);
create policy "logistic_pick_task_admin" on public.pick_task for all to authenticated using (auth.jwt() ->> 'role' = 'admin') with check (auth.jwt() ->> 'role' = 'admin');
create policy "logistic_pick_task_worker_update" on public.pick_task for update to authenticated using (status = 'open' or user_account_id = auth.uid()) with check (user_account_id = auth.uid());

alter table public.pick_task_line enable row level security;
create policy "logistic_pick_task_line_read" on public.pick_task_line for select to authenticated using (true);
create policy "logistic_pick_task_line_admin" on public.pick_task_line for all to authenticated using (auth.jwt() ->> 'role' = 'admin') with check (auth.jwt() ->> 'role' = 'admin');
create policy "logistic_pick_task_line_worker_update" on public.pick_task_line for update to authenticated using (exists (select 1 from public.pick_task t where t.id = pick_task_id and t.user_account_id = auth.uid())) with check (true);

alter table public.shipment enable row level security;
create policy "logistic_shipment_read" on public.shipment for select to authenticated using (true);
create policy "logistic_shipment_admin" on public.shipment for all to authenticated using (auth.jwt() ->> 'role' = 'admin') with check (auth.jwt() ->> 'role' = 'admin');

alter table public.shipment_line enable row level security;
create policy "logistic_shipment_line_read" on public.shipment_line for select to authenticated using (true);
create policy "logistic_shipment_line_admin" on public.shipment_line for all to authenticated using (auth.jwt() ->> 'role' = 'admin') with check (auth.jwt() ->> 'role' = 'admin');

alter table public.tracking_event enable row level security;
create policy "logistic_tracking_event_read" on public.tracking_event for select to authenticated using (true);
create policy "logistic_tracking_event_admin" on public.tracking_event for all to authenticated using (auth.jwt() ->> 'role' = 'admin') with check (auth.jwt() ->> 'role' = 'admin');

alter table public.return_authorization enable row level security;
create policy "logistic_return_authorization_read" on public.return_authorization for select to authenticated using (true);
create policy "logistic_return_authorization_admin" on public.return_authorization for all to authenticated using (auth.jwt() ->> 'role' = 'admin') with check (auth.jwt() ->> 'role' = 'admin');
create policy "logistic_return_authorization_worker_update" on public.return_authorization for update to authenticated using (true) with check (true);

alter table public.return_authorization_line enable row level security;
create policy "logistic_return_authorization_line_read" on public.return_authorization_line for select to authenticated using (true);
create policy "logistic_return_authorization_line_admin" on public.return_authorization_line for all to authenticated using (auth.jwt() ->> 'role' = 'admin') with check (auth.jwt() ->> 'role' = 'admin');
create policy "logistic_return_authorization_line_worker_update" on public.return_authorization_line for update to authenticated using (true) with check (true);

alter table public.cycle_count enable row level security;
create policy "logistic_cycle_count_read" on public.cycle_count for select to authenticated using (true);
create policy "logistic_cycle_count_admin" on public.cycle_count for all to authenticated using (auth.jwt() ->> 'role' = 'admin') with check (auth.jwt() ->> 'role' = 'admin');
create policy "logistic_cycle_count_worker_update" on public.cycle_count for update to authenticated using (user_account_id = auth.uid()) with check (user_account_id = auth.uid());

alter table public.cycle_count_line enable row level security;
create policy "logistic_cycle_count_line_read" on public.cycle_count_line for select to authenticated using (true);
create policy "logistic_cycle_count_line_admin" on public.cycle_count_line for all to authenticated using (auth.jwt() ->> 'role' = 'admin') with check (auth.jwt() ->> 'role' = 'admin');
create policy "logistic_cycle_count_line_worker_update" on public.cycle_count_line for update to authenticated using (exists (select 1 from public.cycle_count c where c.id = cycle_count_id and c.user_account_id = auth.uid())) with check (true);
