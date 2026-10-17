---
'@sveltebuilder/cli': patch
---

`sync:supabase` writes new or changed `supabase/supplemental/*.sql` into a migration created by that run, never into an existing one. With no schema change it asks drizzle-kit for an empty custom migration (`NNNN_supplemental.sql`), registered in drizzle's journal so numbering stays consistent.

Previously the SQL was appended to the latest migration, which a hosted project had usually already applied: `supabase db push` never ran it, so an RLS fix or a new function added after the first deploy never reached production, while `db reset` locally hid the problem.
