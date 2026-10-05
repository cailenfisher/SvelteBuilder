---
'@sveltebuilder/coreui': minor
'@sveltebuilder/local-text-schema': patch
'create-sveltebuilder': patch
---

`ConfirmDialog` is now built on Bits UI's `AlertDialog`, and coreui's remaining hardcoded English
labels become props.

**ConfirmDialog.** It composed the general `Dialog`, so it rendered as `role="dialog"` and an
outside click dismissed it — a stray click could stand in for an answer to a destructive
confirmation. As an `AlertDialog` it is announced as an alert dialog and ignores outside clicks.
It no longer shows a close button (cancel is the way out), Escape is ignored while `loading`, and
`onCancel` now also fires on Escape, not only on the cancel button.

**Labels.** `Dialog` and `Drawer` take `closeLabel`; `Pagination` takes `previousLabel`,
`nextLabel` and `label`. The message surfaces share a new `MessageLabels` set passed once as
`createMessageBus({ labels })` and read from context by `Toast`, `ToastRegion`, `Banner` and
`InlineNotification`. Every label defaults to its previous English text, so existing callers are
unaffected. `Dialog` also drops the hidden "{title} dialog" description it rendered when no
`description` was given.

The base scaffold passes localized labels for all of these, from eight new `message.*` base slugs
seeded in English and French.
