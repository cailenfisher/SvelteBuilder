import { error, fail, redirect } from '@sveltejs/kit';
import { loadScopedCopy } from '$lib/server/scoped-copy';
import type { PickTaskDetailView, PickTaskLineRow } from '@sveltebuilder/logistic/views';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }): Promise<PickTaskDetailView> => {
  if (locals.userAccountId === null) redirect(303, '/sign-in');
  const userAccountId = locals.userAccountId;

  const id = Number(params.id);
  if (!Number.isInteger(id)) throw error(404, 'Not found.');

  const [taskResult, copy] = await Promise.all([
    locals.supabase
      .from('pick_task')
      .select(
        'id, user_account_id, status, created_at, updated_at, pick_task_line(id, pick_task_id, stock_level_id, storage_location_id, sku, requested_quantity, picked_quantity, sequence, created_at, storage_location!inner(id, slug, location_type))'
      )
      .eq('id', id)
      .maybeSingle(),
    loadScopedCopy(
      locals.supabase,
      ['logistic', 'storage_location'],
      locals.locale.code,
      locals.defaultLocale.code
    ),
  ]);

  if (taskResult.error) throw error(500, 'Failed to load the task.');
  if (!taskResult.data) throw error(404, 'Task not found.');

  const row = taskResult.data;

  // A worker may read any task but may only pick against their own, so the screen refuses
  // what the RLS policy would refuse anyway — the difference is that this says why.
  if (row.user_account_id !== userAccountId) throw error(403, 'That task is not yours.');
  if (row.status === 'completed') redirect(303, '/warehouse/pick');
  if (row.status === 'cancelled') throw error(410, 'That task has been cancelled.');

  const toOne = <T>(embed: T | T[] | null): T | null =>
    embed === null ? null : Array.isArray(embed) ? (embed[0] ?? null) : embed;

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
  // Walk order, which is what `sequence` is for: it was snapshotted from the location's
  // sort_order when the task was built, so the picker walks the aisle once.
  lines.sort((a, b) => a.sequence - b.sequence || a.id - b.id);

  return {
    task: {
      id: row.id,
      userAccountId: row.user_account_id,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lines,
    },
    localeCode: locals.locale.code,
    copy,
  };
};

export const actions: Actions = {
  // Update the line and consume the stock physically taken — see the RPC's comment in
  // supabase/supplemental/05-logistic-supplements.sql for why consuming rather than
  // adjusting is the distinction that matters here.
  pick: async ({ locals, params, request }) => {
    const taskId = Number(params.id);
    if (locals.userAccountId === null) return fail(403, { error: 'Not signed in.' });

    const form = await request.formData();
    const lineId = Number(form.get('line_id'));
    const quantity = Number(form.get('quantity'));

    if (!Number.isInteger(lineId)) return fail(422, { error: 'Invalid line.' });
    if (!Number.isInteger(quantity) || quantity < 0) {
      return fail(422, { error: 'Enter zero or a positive whole number.' });
    }

    // Scoped to this task as well as the line, so a crafted post cannot reach a line on
    // someone else's task even where a policy would allow the row.
    const { data: line, error: lineError } = await locals.supabase
      .from('pick_task_line')
      .select('id')
      .eq('id', lineId)
      .eq('pick_task_id', taskId)
      .maybeSingle();

    if (lineError) return fail(500, { error: 'Failed to load the line.' });
    if (line === null) return fail(404, { error: 'That line is not on this task.' });

    const { error: rpcError } = await locals.supabase.rpc('logistic_record_picked_quantity', {
      p_line_id: lineId,
      p_picked_quantity: quantity,
      p_user_account_id: locals.userAccountId,
    });

    if (rpcError) {
      if (rpcError.code === '42501') return fail(403, { error: 'That task is not yours.' });
      // The function refuses more than was requested, and consuming more than is reserved
      // fails the stock_level check constraints.
      if (rpcError.code === '23514' || rpcError.code === 'P0001') {
        return fail(409, { error: 'That quantity is more than this line asked for.' });
      }
      return fail(500, { error: 'Failed to record the pick.' });
    }

    return { success: true as const };
  },

  // Release whatever was reserved but not picked, then close the task. Without the
  // release a short pick leaves stock reserved forever, invisible to every other task.
  complete: async ({ locals, params }) => {
    const id = Number(params.id);
    if (!Number.isInteger(id)) throw error(404, 'Not found.');
    if (locals.userAccountId === null) return fail(403, { error: 'Not signed in.' });

    const { error: rpcError } = await locals.supabase.rpc('logistic_complete_pick_task', {
      p_pick_task_id: id,
      p_user_account_id: locals.userAccountId,
    });

    if (rpcError) {
      if (rpcError.code === '42501') {
        return fail(409, { error: 'That task is not yours, or is no longer in progress.' });
      }
      return fail(500, { error: 'Failed to complete the task.' });
    }

    redirect(303, '/warehouse/pick');
  },
};
