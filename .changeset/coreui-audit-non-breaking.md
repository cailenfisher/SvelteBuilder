---
'@sveltebuilder/coreui': patch
---

Non-breaking fixes from the coreui 1.0 API audit:

- `Drawer` and `LocaleSwitcher` generate their element ids, so two on one page no longer share an id.
- `Switch` inside a `Field` takes the Field's id, hint or error description, `required`, `disabled` and error state, so the Field's label names it. `RadioGroup` inside a `Field` is labelled by it. `DateTimePicker` is described only by the hint or error the Field actually renders.
- `MenuLabel` outside a `MenuGroup` or `MenuRadioGroup` renders a plain label instead of throwing and emptying the menu.
- New change callbacks: `onCheckedChange` on `Switch` and `MenuCheckboxItem`; `onValueChange` on `RadioGroup`, `Select`, `Tabs`, `Accordion` and `MenuRadioGroup`; `onOpenChange` on `Dialog`, `Popover`, `Menu` and `ConfirmDialog`.
- `class` on `ConfirmDialog`, `Toast`, `ToastRegion`, `MessageAriaLive` and `LocaleSwitcher`.
- `FieldContext`, the type `useField()` returns, is exported.
- `@internationalized/date` is declared as a peer dependency, matching bits-ui's.
- Component styles use logical properties, so menus, tables, tabs and toasts mirror correctly in right-to-left layouts.
