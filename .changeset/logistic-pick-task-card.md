---
'@sveltebuilder/logistic': patch
---

`PickTaskCard` forwards its `dictionary` to the `StorageLocationPath` it renders for each line. It did not, so a screen passing scoped copy as a prop saw every line's location render as `[missing: …]`. Cancelled cards and picked lines are no longer dimmed with opacity, which took their text below 4.5:1 contrast; they use secondary text color and, for cancelled, a dashed border.
