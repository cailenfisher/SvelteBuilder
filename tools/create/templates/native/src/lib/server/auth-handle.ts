// Re-exports the Auth.js provider handle so hooks.server.ts can import from a
// stable path. SuperPrototype fills this with the Supabase SSR handle.

export { handle as providerHandle } from '$lib/server/auth';
