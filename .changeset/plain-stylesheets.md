---
'@sveltebuilder/coreui': major
'@sveltebuilder/content': major
'@sveltebuilder/logistic': major
'create-sveltebuilder': minor
---

Components carry no Svelte `<style>` blocks. Every style is a plain stylesheet beside the component
it styles, and each package lists its stylesheets in one entry point the app imports into the
`components` layer: `@sveltebuilder/coreui/styles/components.css` (same path as before),
`@sveltebuilder/content/styles/components.css` and `@sveltebuilder/logistic/styles/components.css`
(new). **Import the module stylesheets you use**, after coreui's, or their components render
unstyled; projects from `npm create sveltebuilder` get the lines automatically. coreui's table rules
now target `.table-row`, `.table-cell` and `.table-header-cell` instead of `tr`, `td` and `th`.

Scaffolded screens import their own stylesheets, and their root classes are named after their view
types (`.inbound-receipt-list-screen`). The base template gains `src/utilities.css` with
`.visually-hidden`, imported into the `utilities` layer. See `docs/MIGRATION-2.0.md`, "Stylesheets".
