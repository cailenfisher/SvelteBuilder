---
'@sveltebuilder/content': patch
'create-sveltebuilder': patch
---

Fix what rendering every content component for the first time found.

- **Missing copy.** `NewsletterSignup` and `ArticleWorkflowPanel` ask for twelve module-scoped slugs (`newsletter.*`, `action.*`) that the content seed never created, so both rendered `[missing: …]` for every label and button. The seed now provides them in English and French. The screen-bundle suite now checks every module-scoped slug a module's components render, not only the ones its screens do.
- **Contrast.** `SectionLabel`, `AuthorProfileView`, `LiveCoverageView`, `NewsletterSignup`, `FrontCurationBoard` and `ArticleWorkflowPanel` used raw `--brand`, `--danger` and `--success` as text colors; they use the `-text` variants now. A pinned `LiveUpdateItem` mixed its background with white, which in dark mode put light text on a near-white panel; it uses `--brand-soft`.
- **`BlockEditorHost`** no longer asks the dictionary for the text of image, video and embed blocks, which logged a missing key for every media block in an article.
