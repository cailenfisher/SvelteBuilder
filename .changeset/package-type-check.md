---
'@sveltebuilder/coreui': patch
'@sveltebuilder/content': patch
---

Fix the defects a first `svelte-check` over each package found.

coreui: `Tooltip`'s `delay` prop now takes effect. It was passed to bits-ui as `openDelay`, which bits-ui v2 does not accept, so every tooltip opened after bits-ui's default 700ms. `Button` declares `disabled` for links as well as buttons, and `EditorBlock` declares the `mediaAssetId` that `BlockEditor` already read.

content: `BlockEditorHost` now works. It mapped blocks with `type` instead of `blockType`, dropped `position`, and listened for an `onChange` that `BlockEditor` never emits, so no edit reached the parent. `ArticleWorkflowPanel` uses coreui's actual `Drawer`, `Tabs`, `Button` and `Checkbox` APIs; its tabs never switched before. `SectionFront` and `AuthorProfileView` pass `ArticleCard` its required `status` and forward `dictionary`, without which entity copy fell back to context and rendered as `[missing: …]`. `NewsletterSignup`'s submit button passes its label as children. `Button` has no `label` prop, so it was rendering an undefined `children` snippet. Finally, `FrontCurationBoard` uses a `Badge` variant that exists.
