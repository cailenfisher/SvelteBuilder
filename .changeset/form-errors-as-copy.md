---
'@sveltebuilder/coreui': major
'@sveltebuilder/content': major
'create-sveltebuilder': minor
'@sveltebuilder/local-text-schema': minor
---

Form-action errors are copy, not English. `ScreenFormResult.error` is a `ScreenFormError`
(`{ slug, detail? }`), and the success branch drops `message`. Scaffolded actions return
`formError(status, slug, detail?)`, and screens show the slug in the reader's language through
`formErrorText`, falling back to the global `feedback.error` (logged) when a slug has no copy. Every
error is seeded in English and French: `logistic.error.*`, `content.error.*`, and global `error.*`
for the base template's screens.

content's `validateArticleForPublish` returns its issues (`PublishValidationIssue[]`, each a
`content.publish_validation.*` slug with values) instead of throwing English text; the publish
action shows them in the editor's language.
