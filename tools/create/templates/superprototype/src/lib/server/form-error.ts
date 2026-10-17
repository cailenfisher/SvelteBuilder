import { fail } from '@sveltejs/kit';
import type { ScreenFormError } from '@sveltebuilder/coreui';

/**
 * A failed form action, reported as copy: `formError(422, 'logistic.error.sku_required')`. The
 * screen resolves the slug in the reader's language (`$lib/FormError/form-error.ts`), so no
 * action returns English. `detail` is text the action could not turn into a slug, such as a
 * database's refusal, and is shown as it is.
 *
 * Every slug passed here must be seeded in every required locale;
 * `tools/create/test/screen-bundle.test.ts` checks it.
 */
export function formError(status: number, slug: string, detail?: string) {
  const error: ScreenFormError = detail === undefined ? { slug } : { slug, detail };
  return fail(status, { error });
}
