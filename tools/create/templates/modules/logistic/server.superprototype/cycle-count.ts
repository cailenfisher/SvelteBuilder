import type { SupabaseClient } from '@supabase/supabase-js';
import type { CycleCountStatus } from '@sveltebuilder/logistic';
import type {
  CycleCountDetailView,
  CycleCountLineRow,
  CycleCountRow,
} from '@sveltebuilder/logistic/views';
import { toOne, type CountedRows, type QueryRange, type QueryResult } from '$lib/server/postgrest';

/**
 * Lines are embedded rather than aggregated because a list shows progress, counted of total,
 * and PostgREST cannot express "count where counted_quantity is not null" beside a plain count
 * in one aggregate embed. Only the two columns the tally needs are selected.
 */
const selectCycleCountRow = (supabase: SupabaseClient, count?: 'exact') =>
  supabase
    .from('cycle_count')
    .select(
      'id, user_account_id, status, created_at, updated_at, cycle_count_line(id, counted_quantity)',
      { count }
    );

type CycleCountRecord = NonNullable<
  Awaited<ReturnType<typeof selectCycleCountRow>>['data']
>[number];

const toCycleCountRow = (row: CycleCountRecord): CycleCountRow => {
  const lines = row.cycle_count_line ?? [];
  return {
    id: row.id,
    userAccountId: row.user_account_id,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lineCount: lines.length,
    countedCount: lines.filter((line) => line.counted_quantity !== null).length,
  };
};

/** Counts newest first, optionally of one status, with the total matching. */
export async function listCycleCount(
  supabase: SupabaseClient,
  filter: { status: CycleCountStatus | null },
  range: QueryRange
): Promise<QueryResult<CountedRows<CycleCountRow>>> {
  let query = selectCycleCountRow(supabase, 'exact')
    .order('created_at', { ascending: false })
    .range(range.offset, range.offset + range.limit - 1);
  if (filter.status !== null) query = query.eq('status', filter.status);

  const { data, error, count } = await query;
  if (error) return { data: null, error };
  return { data: { rows: data.map(toCycleCountRow), total: count ?? data.length }, error: null };
}

/** The counts one worker has taken and not finished, oldest first. */
export async function listAssignedCycleCount(
  supabase: SupabaseClient,
  userAccountId: number,
  limit: number
): Promise<QueryResult<CycleCountRow[]>> {
  const { data, error } = await selectCycleCountRow(supabase)
    .eq('status', 'in_progress')
    .eq('user_account_id', userAccountId)
    .order('created_at')
    .limit(limit);
  if (error) return { data: null, error };
  return { data: data.map(toCycleCountRow), error: null };
}

/** Counts nobody has taken yet, oldest first. */
export async function listOpenCycleCount(
  supabase: SupabaseClient,
  limit: number
): Promise<QueryResult<CycleCountRow[]>> {
  const { data, error } = await selectCycleCountRow(supabase)
    .eq('status', 'open')
    .order('created_at')
    .limit(limit);
  if (error) return { data: null, error };
  return { data: data.map(toCycleCountRow), error: null };
}

/** How many counts are open or in progress. */
export async function countOpenCycleCount(supabase: SupabaseClient): Promise<QueryResult<number>> {
  const { error, count } = await supabase
    .from('cycle_count')
    .select('id', { count: 'exact', head: true })
    .in('status', ['open', 'in_progress']);
  if (error) return { data: null, error };
  return { data: count ?? 0, error: null };
}

/**
 * A count with every line and its storage location, in walk order: by location then SKU, so a
 * counter moving through the aisle follows the page rather than insertion order.
 */
export async function getCycleCount(
  supabase: SupabaseClient,
  id: number
): Promise<QueryResult<CycleCountDetailView['cycleCount'] | null>> {
  const { data: row, error } = await supabase
    .from('cycle_count')
    .select(
      'id, user_account_id, status, created_at, updated_at, cycle_count_line(id, cycle_count_id, stock_level_id, storage_location_id, sku, expected_quantity, counted_quantity, variance, created_at, storage_location!inner(id, slug, location_type))'
    )
    .eq('id', id)
    .maybeSingle();
  if (error) return { data: null, error };
  if (row === null) return { data: null, error: null };

  const lines: CycleCountLineRow[] = [];
  for (const line of row.cycle_count_line ?? []) {
    const location = toOne(line.storage_location);
    if (location === null) continue;
    lines.push({
      id: line.id,
      cycleCountId: line.cycle_count_id,
      stockLevelId: line.stock_level_id,
      storageLocationId: line.storage_location_id,
      sku: line.sku,
      expectedQuantity: line.expected_quantity,
      countedQuantity: line.counted_quantity,
      variance: line.variance,
      createdAt: line.created_at,
      storageLocation: {
        id: location.id,
        slug: location.slug,
        locationType: location.location_type,
      },
    });
  }
  lines.sort((a, b) => a.storageLocationId - b.storageLocationId || a.sku.localeCompare(b.sku));

  return {
    data: {
      id: row.id,
      userAccountId: row.user_account_id,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lines,
    },
    error: null,
  };
}

/**
 * Opening a count snapshots what the system believes is in each chosen bin: the count row plus
 * one line per stock level, so an RPC, and one whose snapshot semantics are the reason it
 * cannot be two calls. The function refuses locations that hold no stock. Returns the new
 * count's id.
 */
export async function createCycleCount(
  supabase: SupabaseClient,
  fields: { storageLocationIds: number[] }
): Promise<QueryResult<number | null>> {
  const { data, error } = await supabase.rpc('logistic_create_cycle_count', {
    p_storage_location_ids: fields.storageLocationIds,
  });
  if (error) return { data: null, error };
  return { data: data as number | null, error: null };
}

/**
 * Claims an open count for the caller (logistic_take_cycle_count, which takes
 * `cycle_count.count`). The `status = open` predicate is what makes it safe when two counters
 * claim the same count at once. False when someone else took it first.
 */
export async function takeCycleCount(supabase: SupabaseClient, id: number): Promise<QueryResult<boolean>> {
  const { data, error } = await supabase.rpc('logistic_take_cycle_count', { p_cycle_count_id: id });
  if (error) return { data: null, error };
  return { data: data === true, error: null };
}

/**
 * Applies every variance the count found and closes it: one adjustment per differing line
 * plus the status update, so an RPC. A partly applied count is the worst outcome, reading as
 * closed while the stock it was meant to correct is still wrong. Raises 42501 when the count
 * can no longer be approved, and 23514 when a variance would take stock below zero.
 */
export async function approveCycleCount(supabase: SupabaseClient, id: number): Promise<QueryResult<null>> {
  const { error } = await supabase.rpc('logistic_approve_cycle_count', { p_cycle_count_id: id });
  if (error) return { data: null, error };
  return { data: null, error: null };
}
