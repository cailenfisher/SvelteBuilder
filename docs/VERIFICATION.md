# Verification gates

What each gate proves, what it cannot see, and why the harnesses work the way they do. The
short table of which gate to run when is in the root `CLAUDE.md`, under _Verification_.

## `pnpm scaffold:check`

`pnpm scaffold:check` scaffolds real projects from `tools/create/templates/` and checks that each
one typechecks and builds. Run it after touching anything under `templates/`, and note that
`svelte-check` is the step that matters — Vite does not typecheck, so a build can pass over a
loader referencing a field that no longer exists.

Templates are the one part of this repo that no package test can reach: they are inert text until
the create CLI copies them into a project. That gap is how the Logistic module came to ship a
scaffold that could not typecheck, from the day SuperPrototype moved to PostgREST until someone
tried it by hand.

Two things the harness does deliberately. It **packs the workspace packages and installs the
tarballs** instead of taking them from npm, because templates are written against the packages in
this repo and those are usually ahead of what is published — verifying against the registry would
mean the gate can never check an unreleased change. (Packing rather than `link:`, because a linked
package brings its own `node_modules/svelte`, and two copies of svelte make every cross-package
`Snippet` prop a type error with no bug behind it. Packing also checks that the `files` array and
`exports` map ship what the templates import.) And it drives the CLI **by flags** (`--template`,
`--pm`, `--modules`, `--screens`), never by feeding keystrokes to its prompts.

## `pnpm sql:check`

`pnpm sql:check` is the companion gate: it applies a scaffolded project's migration and seed to
Postgres in Docker, applies the seed twice to prove it is re-runnable, then asserts the database
behaves as the routes assume — impersonating an admin, a non-admin and an anonymous visitor via
`set role` plus a JWT subject, which is the only way RLS is exercised at all. Assertions live in
`scripts/sql-check/`. Neither `scaffold:check` nor `svelte-check` runs a line of SQL, so a
malformed seed or a policy admitting nobody ships green past them.

## `pnpm test`

`pnpm test` runs the unit suites. Two of them cover what no scaffold harness can see, because the harnesses copy templates from this repo and override package versions: `tools/create/test/template-stored-name.test.ts` checks that `npm pack` publishes every template file (npm silently drops `.gitignore`) and that none is stored under a name it must not have in this repo, and `package-version.test.ts` that every SvelteBuilder dependency a scaffold can receive is pinned to the release, never `latest`. `tools/create/test/screen-bundle.test.ts` checks the half of a screen bundle's contract that types cannot express — that a manifest matches its files, that every
slug a screen renders is seeded, and that each has both required locales.
`tools/create/test/data-module.test.ts` fails a route file that calls `.from(` or `.rpc(` itself.
The package suites render components server-side; how they are configured is in
`packages/CLAUDE.md`.

## `pnpm check`

`pnpm check` type-checks every package's own source (`svelte-check`, or `tsc --noEmit` for
local-text-schema) and runs in the Test workflow. It is the only gate that type-checks a component no
template screen renders.

## `pnpm css:check`

`scripts/css-check.mjs`, also in the Test workflow, enforces the plain-stylesheet rules
(`.claude/rules/css.md`) and reports a class no component mentions, which replaces svelte-check's
unused-selector warning.

## The Accessibility workflow

`apps/dev-kitchen` renders every component the packages export, from source, inside chrome copied
from the base template, and the Accessibility workflow audits it with axe-core (WCAG 2.2 A and AA)
in light, dark and right-to-left, plus overlays opened from the keyboard and a focus-visibility
walk. Its catalog makes an exported component with no showcase page a `pnpm check` failure. It is
where to look at, develop and audit a component; never edit its generated chrome. Rationale in
`docs/DEV-KITCHEN.md`; usage in its README.

## One svelte

The workspace pins a single svelte through `pnpm.overrides` in the root `package.json`, for the same
two-copies reason given under `pnpm scaffold:check`. Bump svelte there, not per package.
