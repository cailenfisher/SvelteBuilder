import type { DictionaryInstance } from 'diglossia';
import type { ScreenFormError } from '@sveltebuilder/coreui';

/**
 * A form action's error in the reader's language. The slug's scope is implied by its name, as
 * for all UI copy: a module's slug starts with the module (`logistic.error.sku_required`, scope
 * `logistic`) and is in the screen's own dictionary; anything else is global copy in the root
 * dictionary (`error.id_invalid`).
 *
 * A slug with no copy, because a seed was not re-run after an upgrade or a row was deleted, shows
 * the global "Something went wrong" (`feedback.error`) in the reader's language rather than a
 * `[missing:]` sentinel, and logs the slug so whoever reads the server log knows what to seed.
 */
export function formErrorText(
  error: ScreenFormError,
  screenDictionary: DictionaryInstance,
  globalDictionary: DictionaryInstance
): string {
  const scope = error.slug.split('.')[0];
  if (screenDictionary.localeOf(error.slug, scope) !== undefined) {
    return screenDictionary.localText(error.slug, scope);
  }
  if (globalDictionary.localeOf(error.slug) !== undefined) {
    return globalDictionary.localText(error.slug);
  }
  console.error(`[form-error] no copy for "${error.slug}"; showing feedback.error instead`);
  return globalDictionary.localText('feedback.error');
}
