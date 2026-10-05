# @sveltebuilder/local-text-schema

## 0.2.1

### Patch Changes

- [#25](https://github.com/cailenfisher/SvelteBuilder/pull/25) [`ca21505`](https://github.com/cailenfisher/SvelteBuilder/commit/ca215055910fc83c8e509f80af791ca3e68cca5d) Thanks [@cailenfisher](https://github.com/cailenfisher)! - `ConfirmDialog` is now built on Bits UI's `AlertDialog`, and coreui's remaining hardcoded English
  labels become props.

  **ConfirmDialog.** It composed the general `Dialog`, so it rendered as `role="dialog"` and an
  outside click dismissed it — a stray click could stand in for an answer to a destructive
  confirmation. As an `AlertDialog` it is announced as an alert dialog and ignores outside clicks.
  It no longer shows a close button (cancel is the way out), Escape is ignored while `loading`, and
  `onCancel` now also fires on Escape, not only on the cancel button.

  **Labels.** `Dialog` and `Drawer` take `closeLabel`; `Pagination` takes `previousLabel`,
  `nextLabel` and `label`. The message surfaces share a new `MessageLabels` set passed once as
  `createMessageBus({ labels })` and read from context by `Toast`, `ToastRegion`, `Banner` and
  `InlineNotification`. Every label defaults to its previous English text, so existing callers are
  unaffected. `Dialog` also drops the hidden "{title} dialog" description it rendered when no
  `description` was given.

  The base scaffold passes localized labels for all of these, from eight new `message.*` base slugs
  seeded in English and French.

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
