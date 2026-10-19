# CLAUDE.md — dev-kitchen

The component harness: it renders every component the packages export, from source, inside
chrome copied from the base template, and the Accessibility workflow audits it with axe-core
(WCAG 2.2 A and AA) in light, dark and right-to-left, plus overlays opened from the keyboard and
a focus-visibility walk. It is where to look at, develop and audit a component.

- **Never edit the generated chrome.** `sync-chrome.mjs` copies it from
  `tools/create/templates/base/` before every `dev`, `build`, `check` and `lint`, and it is
  gitignored. Change the base template instead. The README lists which files are generated.
- **Every exported component needs a showcase page.** `src/lib/catalog.ts` declares a
  `*_COVERAGE` constant per package, and an exported component with no page is a `pnpm check`
  failure.

Usage is in the README; rationale in `docs/DEV-KITCHEN.md`.
