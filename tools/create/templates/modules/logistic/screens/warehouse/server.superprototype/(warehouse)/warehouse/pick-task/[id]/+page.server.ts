import { error, redirect } from '@sveltejs/kit';
import { loadScopedCopy } from '$lib/server/scoped-copy';
import { getPickTaskLine, recordPickTaskLineQuantity } from '$lib/server/logistic/pick-task-line';
import { completePickTask, getPickTask } from '$lib/server/logistic/pick-task';
import type { PickTaskWarehouseDetailView } from '@sveltebuilder/logistic/views';
import type { Actions, PageServerLoad } from './$types';
import { formError } from '$lib/server/form-error';

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
    if (locals.userAccountId === null) return formError(403, 'logistic.error.not_signed_in');

    const form = await request.formData();
    const lineId = Number(form.get('pick_task_line_id'));
    const quantity = Number(form.get('quantity'));

    if (!Number.isInteger(lineId)) return formError(422, 'logistic.error.line_invalid');
    if (!Number.isInteger(quantity) || quantity < 0) {
      return formError(422, 'logistic.error.whole_number_required');
    }

    const { data: line, error: lineError } = await getPickTaskLine(locals.supabase, taskId, lineId);

    if (lineError) return formError(500, 'logistic.error.line_load_failed');
    if (line === null) return formError(404, 'logistic.error.pick_task_line_mismatch');

    const { error: rpcError } = await recordPickTaskLineQuantity(locals.supabase, {
      id: lineId,
      pickedQuantity: quantity,
      userAccountId: locals.userAccountId,
    });

    if (rpcError) {
      if (rpcError.code === '42501') return formError(403, 'logistic.error.pick_task_not_yours');
      if (rpcError.code === '23514' || rpcError.code === 'P0001') {
        return formError(409, 'logistic.error.picked_quantity_too_high');
      }
      return formError(500, 'logistic.error.pick_save_failed');
    }

    return { success: true as const };
  },

  complete: async ({ locals, params }) => {
    const id = Number(params.id);
    if (!Number.isInteger(id)) throw error(404, 'Not found.');
    if (locals.userAccountId === null) return formError(403, 'logistic.error.not_signed_in');

    const { error: rpcError } = await completePickTask(locals.supabase, id, locals.userAccountId);

    if (rpcError) {
      if (rpcError.code === '42501') {
        return formError(409, 'logistic.error.pick_task_not_in_progress');
      }
      return formError(500, 'logistic.error.pick_task_complete_failed');
    }

    redirect(303, '/warehouse/pick-task');
  },
};
