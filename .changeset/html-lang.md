---
'create-sveltebuilder': patch
---

Scaffolded apps now declare their page language. `app.html` has always carried `<html lang="%sveltekit.lang%">`, but that is not a placeholder SvelteKit fills on its own, and no hook replaced it, so every page shipped the literal string as its language (a WCAG 3.1.1 failure). Both templates' `hooks.server.ts` now fill it with the resolved locale code through `transformPageChunk`. In the base template the code comes from a cookie or header, so it is only used when shaped like a language tag.

The root layout also no longer raises svelte's `state_referenced_locally` warning in `pnpm check`. Capturing the first `data.dictionary` is intended, since a locale switch is a full page load.
