import { error, fail, redirect } from '@sveltejs/kit';
import { loadScopedCopy } from '$lib/server/scoped-copy';
import type { PickTask } from '@sveltebuilder/logistic';
import type { PickQueueView } from '@sveltebuilder/logistic/views';
import type { Actions, PageServerLoad } from './$types';

const PICK_TASK_COLUMNS = 'id, user_account_id, status, created_at, updated_at';

export const load: PageServerLoad = async ({ locals }): Promise<PickQueueView> => {
  // The layout's load has already redirected an anonymous visitor, so this is not null by
  // the time the page loads. Narrowing rather than asserting keeps that checkable.
  if (locals.userAccountId === null) redirect(303, '/sign-in');
  const userAccountId = locals.userAccountId;

  const [mineResult, openResult, copy] = await Promise.all([
    locals.supabase
      .from('pick_task')
      .select(PICK_TASK_COLUMNS)
      .eq('status', 'in_progress')
      .eq('user_account_id', userAccountId)
      .order('created_at')
      .limit(5),
    locals.supabase
      .from('pick_task')
      .select(PICK_TASK_COLUMNS, { count: 'exact' })
      .eq('status', 'open')
      .order('created_at')
      .limit(20),
    loadScopedCopy(locals.supabase, ['logistic'], locals.locale.code, locals.defaultLocale.code),
  ]);

  if (mineResult.error) throw error(500, 'Failed to load your tasks.');
  if (openResult.error) throw error(500, 'Failed to load the open queue.');

  const toTask = (row: {
    id: number;
    user_account_id: number | null;
    status: PickTask['status'];
    created_at: string;
    updated_at: string;
  }): PickTask => ({
    id: row.id,
    userAccountId: row.user_account_id,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });

  return {
    myTasks: (mineResult.data ?? []).map(toTask),
    openTasks: (openResult.data ?? []).map(toTask),
    openTotal: openResult.count ?? 0,
    localeCode: locals.locale.code,
    copy,
  };
};

export const actions: Actions = {
  // One conditional update, so a plain call. The `status = open` predicate is what makes
  // claiming a task safe under concurrency: two workers pressing Take at once means the
  // second update matches no row, and the row count tells us which happened.
  take: async ({ locals, request }) => {
    if (locals.userAccountId === null) return fail(403, { error: 'Not signed in.' });

    const form = await request.formData();
    const taskId = Number(form.get('task_id'));
    if (!Number.isInteger(taskId)) return fail(422, { error: 'Invalid task.' });

    const { data, error: updateError } = await locals.supabase
      .from('pick_task')
      .update({ status: 'in_progress', user_account_id: locals.userAccountId })
      .eq('id', taskId)
      .eq('status', 'open')
      .select('id');

    if (updateError) return fail(500, { error: 'Failed to take the task.' });
    if ((data ?? []).length === 0) {
      return fail(409, { error: 'Someone else has already taken that task.' });
    }

    redirect(303, `/warehouse/pick/${taskId}`);
  },
};
