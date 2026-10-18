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

/**
 * A failed write, reported by what Postgres said rather than as one generic failure: the access
 * RPCs refuse with `42501` when the caller may not, and a constraint or trigger with `23505`,
 * `23503` or `23514` when the input itself is the problem. Each of those has its own slug in
 * `slugByCode`; anything else is `fallbackSlug`, with a 500.
 */
export function postgrestFormError(
  error: { code?: string },
  fallbackSlug: string,
  slugByCode: Partial<Record<'42501' | '23505' | '23503' | '23514', string>>
) {
  const code = error.code as keyof typeof slugByCode | undefined;
  const slug = code === undefined ? undefined : slugByCode[code];
  if (slug === undefined) return formError(500, fallbackSlug);
  return formError(code === '42501' ? 403 : 409, slug);
}
