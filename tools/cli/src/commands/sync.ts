import { syncSupabase } from './sync-supabase.ts';

/** @deprecated Use syncSupabase directly. This alias will be removed in a future release. */
export async function sync(root?: string): Promise<void> {
  console.warn('[sveltebuilder] `sync` is deprecated — use `sync:supabase` instead');
  return syncSupabase(root);
}
