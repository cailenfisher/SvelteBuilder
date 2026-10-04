# @sveltebuilder/local-text-schema

## 0.2.0

### Minor Changes

- [#11](https://github.com/cailenfisher/SvelteBuilder/pull/11) [`99b6a39`](https://github.com/cailenfisher/SvelteBuilder/commit/99b6a39abb4483d5646a78dad81d229808f8d598) Thanks [@cailenfisher](https://github.com/cailenfisher)! - Make `local_text_link` uniqueness actually cover global copy.

  The table carried a plain unique index on `(slug, scope, entity_id)` plus a partial unique index on
  `(slug, scope) where entity_id is null`. Between them, nothing constrained global copy: those rows
  have `scope` and `entity_id` both null, and Postgres treats nulls as distinct in a unique index, so
  re-inserting `('app.name', null, null)` was accepted as a new row every time.

  That made `on conflict do nothing` a silent no-op for precisely the rows the base seed consists of —
  re-running `supabase/seed.sql` duplicated all 90 global links, and `get_dictionary`'s `distinct on`
  kept the dictionary resolving correctly, so the first visible symptom was a doubled admin list
  rather than an error.

  Both indexes are replaced by a single `unique (slug, scope, entity_id) nulls not distinct`, which
  covers all three cases: global copy and scoped UI copy each conflict on a repeat insert, while
  per-entity copy sharing a slug and scope across different `entity_id` values is still allowed.

  Existing projects: run `sveltebuilder sync:supabase` to generate the migration that swaps the
  indexes for the constraint. If a database already holds duplicated global links, de-duplicate before
  applying it or the constraint will fail to build.
