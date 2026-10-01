---
"create-sveltebuilder": minor
"@sveltebuilder/logistic": minor
---

Screens are delivered as selectable bundles, with the module's view types as the contract.

`create-sveltebuilder` gains a **screen selection** prompt after module selection. A module ships
schema, components and SQL; the screens that use them are scaffolded from the template tree and owned
by the generated project afterwards. Not every app wants every screen a module offers, so they are now
chosen rather than assumed. Defaults to all, and expands a selection to include anything the chosen
bundles declare in `requires` (reporting what it added), so a screen never ships without the siblings
it cross-links to.

A bundle lives at `templates/modules/<module>/screens/<id>/` as `manifest.json` plus two halves:

- **`ui/`** — the `+page.svelte` files, provider-neutral, importing their view-model types from the
  module package.
- **`server.superprototype/`** — loaders and form actions for that scaffold flavour. `server.native/`
  is where Native's would go if it revives.

They merge into the same route directories at scaffold time, so the generated project has a screen and
its loader side by side despite being authored apart.

`@sveltebuilder/logistic` gains **`./views`**, the contract that makes the split safe: a screen imports
`SupplierListView`, every flavour's loader returns it, and a disagreement is a compile error rather
than a runtime surprise. The selectable unit is a feature bundle, not a route file, because screens
cross-link.

The **supplier** bundle is the first ported: list and detail, with update/addContact/deleteContact form
actions rewritten against `event.locals.supabase`. It is also now properly internationalised — the
originals had hardcoded English — using global copy from the layout's dictionary for action labels and
the module's own scoped copy for everything else, with twelve new slugs seeded in EN and FR.

The remaining logistic route templates move to `screens/_unported/`, which nothing copies, so only
ported bundles are reachable. Logistic stays gated in the CLI until the port finishes.
