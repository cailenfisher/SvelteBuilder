---
"create-sveltebuilder": minor
---

Non-interactive flags, a scaffold-and-build CI gate, and module availability read from the tree.

**Flags.** `--template`, `--pm`, `--modules`, and `--screens` each skip their prompt, so supplying all
of them makes a run fully non-interactive. Useful to anyone scripting project creation, and required by
the new CI gate — driving a TUI by feeding keystrokes to a pseudo-terminal works right up until a
prompt is added or reordered.

**`pnpm scaffold:check`.** Scaffolds real projects from the template tree and checks each typechecks
and builds, across four cases: bare, content, logistic with all screens, and logistic with none. This
closes the gap that let the Logistic module ship a scaffold which could not typecheck, from the day
SuperPrototype moved to PostgREST until a manual smoke test found it — templates are inert text until
the CLI copies them, so no package test could reach them. It runs as a GitHub Actions matrix on pushes
to main and dev and on pull requests.

The harness links the workspace packages into each project rather than installing them from npm:
templates are written against the packages in this repo, which are usually ahead of the registry, so
verifying against published copies would mean the gate can never check an unreleased change. Verified
by deliberately reintroducing the original bug (`locals.supabase` → `locals.db`), which the gate
catches at the `check` step — `build` passes straight over it, since Vite does not typecheck.

**Module availability is now data-driven.** The Logistic gate is removed. It existed because the
module's route templates called a data layer SuperPrototype had dropped, and what actually fixed that
was moving the unported ones into `screens/_unported/`, which the CLI never copies. Each module's hint
now reports its screen coverage read from the template tree — how many bundles exist, and whether more
are pending — so a module becomes more capable as bundles land with nothing here to maintain by hand. A
module with no bundles is still perfectly installable; it brings schema, components and SQL rather than
pages.
