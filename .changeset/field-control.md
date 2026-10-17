---
'@sveltebuilder/coreui': major
'@sveltebuilder/logistic': major
---

`useField()` returns `FieldControl`: the five attributes a control puts on its focusable element,
under their HTML names (`id`, `aria-describedby`, `aria-invalid`, `required`, `disabled`), so a
custom control can spread it. `FieldContext` is no longer exported. `Field` works out the
description once, so a control with its own `error` (`Input`, `Textarea`, `Select`) is still
marked invalid but never points `aria-describedby` at an error message the `Field` did not render.
logistic's `BarcodeInput` uses the new shape.
