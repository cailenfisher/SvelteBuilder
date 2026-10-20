import type { SupabaseClient } from '@supabase/supabase-js';
import type { PickTask } from '@sveltebuilder/logistic';
import type { PickTaskLineRow, PickTaskWarehouseDetailView } from '@sveltebuilder/logistic/views';
import { toOne, type CountedRows, type QueryResult } from '$lib/server/postgrest';

const selectPickTask = (supabase: SupabaseClient, count?: 'exact') =>
  supabase
    .from('pick_task')
    .select('id, user_account_id, status, created_at, updated_at', { count });

type PickTaskRecord = NonNullable<Awaited<ReturnType<typeof selectPickTask>>['data']>[number];

const toPickTask = (row: PickTaskRecord): PickTask => ({
  id: row.id,
  userAccountId: row.user_account_id,
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

/** The tasks one worker has taken and not finished, oldest first. */
export async function listAssignedPickTask(
  supabase: SupabaseClient,
  userAccountId: number,
  limit: number
): Promise<QueryResult<PickTask[]>> {
  const { data, error } = await selectPickTask(supabase)
    .eq('status', 'in_progress')
    .eq('user_account_id', userAccountId)
    .order('created_at')
    .limit(limit);
  if (error) return { data: null, error };
  return { data: data.map(toPickTask), error: null };
}

/** Tasks nobody has taken yet, oldest first, with how many there are in all. */
export async function listOpenPickTask(
  supabase: SupabaseClient,
  limit: number
): Promise<QueryResult<CountedRows<PickTask>>> {
  const { data, error, count } = await selectPickTask(supabase, 'exact')
    .eq('status', 'open')
    .order('created_at')
    .limit(limit);
  if (error) return { data: null, error };
  return { data: { rows: data.map(toPickTask), total: count ?? data.length }, error: null };
}

/**
 * A task with every line and its storage location, in walk order: `sequence` was snapshotted
 * from the location's position when the task was built, so the picker walks the aisle once.
 */
export async function getPickTask(
  supabase: SupabaseClient,
  id: number
): Promise<QueryResult<PickTaskWarehouseDetailView['pickTask'] | null>> {
  const { data: row, error } = await supabase
    .from('pick_task')
    .select(
      'id, user_account_id, status, created_at, updated_at, pick_task_line(id, pick_task_id, stock_level_id, storage_location_id, sku, requested_quantity, picked_quantity, sequence, created_at, storage_location!inner(id, slug, location_type))'
    )
    .eq('id', id)
    .maybeSingle();
  if (error) return { data: null, error };
  if (row === null) return { data: null, error: null };

  const lines: PickTaskLineRow[] = [];
  for (const line of row.pick_task_line ?? []) {
    const location = toOne(line.storage_location);
    if (location === null) continue;
    lines.push({
      id: line.id,
      pickTaskId: line.pick_task_id,
      stockLevelId: line.stock_level_id,
      storageLocationId: line.storage_location_id,
      sku: line.sku,
      requestedQuantity: line.requested_quantity,
      pickedQuantity: line.picked_quantity,
      sequence: line.sequence,
      createdAt: line.created_at,
      storageLocation: {
        id: location.id,
        slug: location.slug,
        locationType: location.location_type,
      },
    });
  }
  lines.sort((a, b) => a.sequence - b.sequence || a.id - b.id);

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
 * Claims an open task for the caller (logistic_take_pick_task, which takes `pick_task.pick`).
 * The `status = open` predicate is what makes claiming safe under concurrency: two workers
 * pressing Take at once means the second matches no row. False when someone else took it first.
 */
export async function takePickTask(supabase: SupabaseClient, id: number): Promise<QueryResult<boolean>> {
  const { data, error } = await supabase.rpc('logistic_take_pick_task', { p_pick_task_id: id });
  if (error) return { data: null, error };
  return { data: data === true, error: null };
}

/**
 * Releases whatever was reserved but not picked, then closes the task. Without the release a
 * short pick leaves stock reserved forever, invisible to every other task. Raises 42501 when
 * the task is not the caller's or is no longer in progress.
 */
export async function completePickTask(supabase: SupabaseClient, id: number): Promise<QueryResult<null>> {
  const { error } = await supabase.rpc('logistic_complete_pick_task', { p_pick_task_id: id });
  if (error) return { data: null, error };
  return { data: null, error: null };
}
