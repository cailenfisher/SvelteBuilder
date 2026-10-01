# @sveltebuilder/cli

## 0.0.14

### Patch Changes

- [#11](https://github.com/cailenfisher/SvelteBuilder/pull/11) [`99b6a39`](https://github.com/cailenfisher/SvelteBuilder/commit/99b6a39abb4483d5646a78dad81d229808f8d598) Thanks [@cailenfisher](https://github.com/cailenfisher)! - Stop `sync:supabase` re-appending every supplemental file to each new migration.

  The already-appended check only inspected the newest migration. A freshly generated migration
  contains no markers, so every schema change re-appended the project's entire `supabase/supplemental/`
  set into it — by the second migration the RLS policies, auth functions, and RPCs were all duplicated,
  and they accumulated another copy per migration after that. The SQL is idempotent, so `db reset` still
  produced a correct database; the migrations just grew a full copy of it each time.

  The check now runs against all migrations, and tests each file's content rather than its marker. An
  unchanged supplemental file is found verbatim in an earlier migration and skipped; an edited one is
  not found, so it is appended to the latest migration and reaches the database on the next reset. A
  marker-only check would have fixed the duplication but left edited supplemental SQL permanently
  unapplied. Comparing content also recognises blocks appended by earlier versions of this command,
  which wrote the same marker without one.

- Updated dependencies [[`99b6a39`](https://github.com/cailenfisher/SvelteBuilder/commit/99b6a39abb4483d5646a78dad81d229808f8d598)]:
  - @sveltebuilder/local-text-schema@0.2.0
