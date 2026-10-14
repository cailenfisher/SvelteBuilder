import { error, fail, redirect } from '@sveltejs/kit';
import { loadScopedCopy } from '$lib/server/scoped-copy';
import { getPickTaskLine, recordPickTaskLineQuantity } from '$lib/server/logistic/pick-task-line';
import { completePickTask, getPickTask } from '$lib/server/logistic/pick-task';
import type { PickTaskWarehouseDetailView } from '@sveltebuilder/logistic/views';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({
  locals,
  params,
}): Promise<PickTaskWarehouseDetailView> => {
  if (locals.userAccountId === null) redirect(303, '/sign-in');

  const id = Number(params.id);
  if (!Number.isInteger(id)) throw error(404, 'Not found.');

  const [taskResult, copy] = await Promise.all([
    getPickTask(locals.supabase, id),
    loadScopedCopy(
      locals.supabase,
      ['logistic', 'storage_location'],
      locals.locale.code,
      locals.defaultLocale.code
    ),
  ]);

  if (taskResult.error) throw error(500, 'Failed to load the task.');
  if (!taskResult.data) throw error(404, 'Task not found.');

  const pickTask = taskResult.data;

  // A worker may read any task but may only pick against their own, so the screen refuses
  // what the RLS policy would refuse anyway — the difference is that this says why.
  if (pickTask.userAccountId !== locals.userAccountId) throw error(403, 'That task is not yours.');
  if (pickTask.status === 'completed') redirect(303, '/warehouse/pick-task');
  if (pickTask.status === 'cancelled') throw error(410, 'That task has been cancelled.');

  return {
    pickTask,
    localeCode: locals.locale.code,
    copy,
  };
};

export const actions: Actions = {
  pick: async ({ locals, params, request }) => {
    const taskId = Number(params.id);
    if (locals.userAccountId === null) return fail(403, { error: 'Not signed in.' });

    const form = await request.formData();
    const lineId = Number(form.get('pick_task_line_id'));
    const quantity = Number(form.get('quantity'));

    if (!Number.isInteger(lineId)) return fail(422, { error: 'Invalid line.' });
    if (!Number.isInteger(quantity) || quantity < 0) {
      return fail(422, { error: 'Enter zero or a positive whole number.' });
    }

    const { data: line, error: lineError } = await getPickTaskLine(locals.supabase, taskId, lineId);

    if (lineError) return fail(500, { error: 'Failed to load the line.' });
    if (line === null) return fail(404, { error: 'That line is not on this task.' });

    const { error: rpcError } = await recordPickTaskLineQuantity(locals.supabase, {
      id: lineId,
      pickedQuantity: quantity,
      userAccountId: locals.userAccountId,
    });

    if (rpcError) {
      if (rpcError.code === '42501') return fail(403, { error: 'That task is not yours.' });
      if (rpcError.code === '23514' || rpcError.code === 'P0001') {
        return fail(409, { error: 'That quantity is more than this line asked for.' });
      }
      return fail(500, { error: 'Failed to record the pick.' });
    }

    return { success: true as const };
  },

  complete: async ({ locals, params }) => {
    const id = Number(params.id);
    if (!Number.isInteger(id)) throw error(404, 'Not found.');
    if (locals.userAccountId === null) return fail(403, { error: 'Not signed in.' });

    const { error: rpcError } = await completePickTask(locals.supabase, id, locals.userAccountId);

    if (rpcError) {
      if (rpcError.code === '42501') {
        return fail(409, { error: 'That task is not yours, or is no longer in progress.' });
      }
      return fail(500, { error: 'Failed to complete the task.' });
    }

    redirect(303, '/warehouse/pick-task');
  },
};
