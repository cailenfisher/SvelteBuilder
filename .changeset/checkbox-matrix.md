---
'@sveltebuilder/coreui': patch
---

New `CheckboxMatrix`: a table of checkboxes, one per row-and-column pair, such as a role's permissions with kinds of thing down the side and actions across the top. Each box is named by its row and column headers; a cell held through something else renders checked and read-only, with its source as visible text and as the box's description; a read-only matrix toggles and submits nothing. Exports `CheckboxMatrixRow`, `CheckboxMatrixColumn` and `CheckboxMatrixCell`.

`Checkbox` takes three new optional props: `readonly` (focusable, announced, not toggleable), `aria-labelledby` and `aria-describedby`.
