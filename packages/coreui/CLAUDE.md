# CLAUDE.md — @sveltebuilder/coreui

Universal, domain-agnostic components. `packages/CLAUDE.md` applies here too.

- **No `diglossia` import, and no English defaults.** Every user-facing string is a prop, every
  accessible name is required, and a component with many strings takes one typed `labels` prop
  (the root CLAUDE.md, _Svelte 5 / Framework Conventions_).
- **Every prop is defended against a real domain need.** Flexibility for its own sake is rejected.
- **Know what is public API before changing it.** Exports, props, callbacks, snippets, the CSS
  surface (classes, modifiers, data attributes, tokens) and each component's accessibility
  guarantees are covered by semver. `docs/COREUI-COMPATIBILITY.md` lists them and what each kind of
  change costs.
- **Shared screen-contract types are declared here once**: `ScreenCopy`, `ScreenLocale`,
  `ScreenPage` and `ScreenFormResult` are type-only exports, imported by every module's `views.ts`.
- **Write coreui changesets as `patch` wherever defensible.** A coreui `minor` makes Changesets
  bump `content` and `logistic` a `major`: their `workspace:^` peer on 0.x coreui excludes the next
  minor, and widening a peer range counts as breaking. Check `pnpm changeset status --verbose`
  before merging. The fix (coreui 1.0, or wider peer ranges) is in `docs/DEFERRED.md`.
