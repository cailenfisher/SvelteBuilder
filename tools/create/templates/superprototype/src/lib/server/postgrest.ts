import type { PostgrestError } from '@supabase/supabase-js';

/**
 * What every data module function returns: supabase-js's own `{ data, error }` result, with
 * the rows already converted to camelCase. The data module owns the table, the columns and the
 * conversion; the route owns what a failure means to the person on the other end, whether a
 * 500, a form error or a logged fallback, so each route checks `error` where it calls.
 */
export type QueryResult<T> = { data: T; error: null } | { data: null; error: PostgrestError };

/** A slice of a longer list: which rows to return, counted from zero. */
export type QueryRange = { offset: number; limit: number };

/** The rows of one slice, and how many rows match the filter in all. */
export type CountedRows<T> = { rows: T[]; total: number };

/**
 * Narrows a to-one embed to the single row it actually is.
 *
 * PostgREST returns a many-to-one embed (`navigation_item` → `local_text_link`) as
 * an object, but supabase-js has no way to know the relation's cardinality without
 * generated database types, so it types every embed as an array. Reading `.slug`
 * straight off the embed therefore fails to typecheck while working perfectly at
 * runtime — which is exactly the kind of mismatch that goes unnoticed until
 * `svelte-check` runs.
 *
 * Accepts either shape so it stays correct if generated types are introduced later.
 */
export function toOne<T>(embed: T | T[] | null | undefined): T | null {
  if (embed === null || embed === undefined) return null;
  return Array.isArray(embed) ? (embed[0] ?? null) : embed;
}
