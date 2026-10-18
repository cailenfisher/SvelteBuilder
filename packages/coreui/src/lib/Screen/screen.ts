// The shapes every module's screen contract shares. A screen (`+page.svelte`) and the loader that
// feeds it ship separately (docs/MODULE-ROUTES.md), so a module's view types state the boundary;
// these are the parts of that boundary that are the same in every module. Type-only: nothing here
// exists at runtime, and the diglossia import is erased.
import type { DictionaryPayload } from 'diglossia';

/**
 * The copy a screen renders that the root dictionary does not carry: the module's UI copy (scope =
 * module name) and the entity-bound copy for the rows on the page (scope = table name). Already
 * resolved to one entry per key; diglossia only flattens it.
 */
export type ScreenCopy = {
  copy: DictionaryPayload;
};

/**
 * What the reader may do on a screen's scope (`create`, `update`, a module verb), so it shows
 * only the controls that will work. A courtesy: the database refuses what is not allowed,
 * whatever the screen shows. Absent when a loader does not report it, in which case a screen
 * shows every control and lets the database answer.
 */
export type ScreenAction = {
  actions?: string[];
};

/**
 * The locale a screen formats dates and numbers in. Carried on the view rather than read from the
 * root layout's data, because a screen is provider-neutral and the layout's shape is the scaffold's
 * business.
 */
export type ScreenLocale = {
  localeCode: string;
};

/**
 * A server-paginated list. The loader owns the slice, because DataTable is a controlled component:
 * paging client-side would mean shipping every row to do it.
 */
export type ScreenPage = {
  page: number;
  perPage: number;
  /** Rows matching the filter, not rows on this page. */
  total: number;
};

/**
 * Why a form action failed, as copy rather than text: the action knows what went wrong, the screen
 * knows the reader's language.
 */
export type ScreenFormError = {
  /**
   * A copy slug. A module's starts with the module's name, which is also its scope
   * (`logistic.error.sku_required` in scope `logistic`); the base template's are global
   * (`error.id_invalid`).
   */
  slug: string;
  /**
   * Text the action had and could not turn into a slug, shown as it is: a database's refusal, or
   * a list the action already translated.
   */
  detail?: string;
};

/**
 * What a screen's form actions return. `fail()` payloads and successful returns share one shape so
 * a screen can render `form?.error` without narrowing per action, which is why the success branch
 * declares `error?: undefined` rather than omitting the key.
 */
export type ScreenFormResult =
  | { success: true; error?: undefined }
  | { success?: false; error: ScreenFormError };
