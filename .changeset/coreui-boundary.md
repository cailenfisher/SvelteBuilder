---
'@sveltebuilder/coreui': major
'@sveltebuilder/content': major
'@sveltebuilder/logistic': major
'create-sveltebuilder': minor
---

coreui now holds only domain-agnostic components. Breaking: four things left it.

- **`BlockEditor` moved to content** and merged with `BlockEditorHost` into one component,
  `ArticleBlockEditor`. It takes the article's saved `blocks`, resolves their text and its own
  controls' copy from the dictionary (no more hard-coded English), and reports changes as
  `ArticleBlockDraft[]` (formerly coreui's `EditorBlock`). The unused `articleId` and `locale`
  props are gone. Its classes are `.article-block-editor` and `.article-block-editor__*`. The
  content seed adds its copy, and a name for each `article_block_type`, in English and French.
- **`LocaleEdit`, `LocalTextEdit` and `LocalTextLinkEdit` moved into the base scaffold** as
  `LocaleFieldset`, `LocalTextFieldset` and `LocalTextLinkFieldset` under `src/lib/`, each a
  `<fieldset>` the page places inside its own form. They now generate their
  field ids, so several on one page no longer collide, and no longer show English placeholders.
- **`BarcodeInput` moved to logistic**, and composes with coreui's `Field`: wrap it in a `Field`,
  which supplies the label, hint and error. Its `label` and `error` props are removed, and
  `placeholder` no longer defaults to English.
- **`StatusBadge` is removed.** Use `Badge`, passing the label as its content. The logistic status
  badges wrap `Badge` directly.

`Alert` and `InlineNotification` both stay, with the difference now documented: `Alert` is static
page content, and `InlineNotification` is the message system's surface for the result of
something the user did.
