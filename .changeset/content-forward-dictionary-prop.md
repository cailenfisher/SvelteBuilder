---
'@sveltebuilder/content': patch
---

Camp 2 components now forward the `dictionary` prop to the Camp 2 components they render, and
`ArticleCard` asks for the status slug the seed actually writes.

**Article bodies rendered as `[missing: …]` sentinels on every install before this.** Four composite
components accepted a `dictionary` prop, used it for their own copy, then rendered child Camp 2
components without passing it on. The children fell back to `getDictionary()` — the root layout's
context dictionary, which by design carries only global scope-null copy — so every string resolved by
a child became a sentinel: every paragraph of every article body, every byline, section label, topic
tag, image caption and live update. Twelve call sites across `ArticleView`, `ArticleCard`,
`ArticleBlockRenderer` and `LiveCoverageView`.

The screens were never at fault. They pass `dictionary={scoped}` correctly; the break was one level
down, inside the package.

`ArticleCard` also asked for `article_status:label` while the module's seed writes
`article_status:name` — as do all four admin screens and every sibling entity (`section`, `topic`,
`author_profile`, `tag`). `label` belongs to `publish_checklist_item`, a different scope. This one was
dormant behind `showStatus`, which defaults to false, so only a caller opting into the status badge
saw it. Two lines above it, `statusVariant` tested for a `ready_to_publish` status the module does not
seed — the workflow statuses are `pitch`, `draft`, `in_review`, `ready`, `published`, `archived` — so
the `ready` state never got its badge variant. Both now use the seeded vocabulary, via a lookup that
falls through to `default` for statuses a project adds itself.

**Why none of this was caught:** `dictionary` is an optional prop, so omitting it is valid TypeScript
and `svelte-check` passes. The components had no tests, and no template screen renders them in CI —
the gap `docs/DEV-KITCHEN.md` describes. `pnpm sql:check` runs no components and `pnpm scaffold:check`
only typechecks and builds. It took scaffolding a project by hand and reading the page.

So the package now ships a test suite that renders every Camp 2 component with the dictionary supplied
as a prop — the way a screen supplies it — and asserts that nothing went missing. It asserts on
diglossia's `onMissing` hook rather than scanning the HTML for `[missing:`, because a sentinel can land
somewhere a string scan would plausibly not look, such as `MediaFigure`'s `alt` attribute; the HTML
scan stays as a backstop. The composite cases additionally assert that child-resolved copy appears in
the output, which is what actually pins the forwarding. Each of the three defects above was
re-introduced one at a time to confirm the suite fails on it.

Also fixes an unused-variable lint error in `buildArticleMetaTags`, where `og:site_name` recomputed
the publisher name inline instead of using the one already in scope. No behaviour change — it was the
same expression — but it left `pnpm lint` red for the package.
