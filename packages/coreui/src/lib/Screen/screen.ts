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
 * What a screen's form actions return. `fail()` payloads and successful returns share one shape so
 * a screen can render `form?.error` without narrowing per action, which is why the success branch
 * declares `error?: undefined` rather than omitting the key.
 */
export type ScreenFormResult =
  | { success: true; message?: string; error?: undefined }
  | { success?: false; error: string };
