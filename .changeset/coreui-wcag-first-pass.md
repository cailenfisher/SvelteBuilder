---
'@sveltebuilder/coreui': minor
---

Fix the WCAG 2.2 A and AA failures the first automated audit of every component found. Several of them changed what keyboard and screen-reader users could do at all.

**Keyboard.** The built-in triggers of `Dialog`, `Menu`, `Popover` and `Tooltip` were `display: contents`, which in Chromium takes a button out of the focus order, so none of those overlays could be opened from the keyboard. They are now real, styled-away buttons that look the same. `Drawer`'s trigger gets the same treatment.

**Labels and roles.** A `Select` inside a `Field` was never associated with the Field's label. It is now a select-only combobox (`role="combobox"`) named by the label plus its current value, described by the Field's hint or error, and pointing at its listbox, which is named too. `Field` exposes a `labelId` in its context for that. `ToastRegion` is a named `region` landmark rather than a role-less `div` with an `aria-label`. `BlockEditor` no longer puts an `aria-label` on a list item. `MenuLabel` documents that it must sit inside a `MenuGroup` or `MenuRadioGroup`; outside one it throws, taking the whole menu with it.

**Contrast.** Derived color tokens hold 4.5:1 for any base color, not only the defaults:
- `--*-text` (and `--link-text`) are the family's hue at a fixed OKLCH lightness (0.48 light, 0.80 dark) instead of a 10% mix toward black, which left the scaffold's `#45b1e8` brand at 2.4:1.
- `--*-fg`, the text on a solid fill, is black or white by the fill's WCAG luminance, computed in CSS, so it is the better of the two for every color.
- `--text-soft` and `--text-muted` sit at fixed lightnesses that pass on `--surface` and `--surface-raised`.
- Focus rings use `--brand-text`, which clears the 3:1 that WCAG 1.4.11 requires of an indicator. Plain links take `--link-text`; they previously kept the browser's default blue, which measures 1.9:1 in dark mode.
- Notification and banner detail text, toggles and actions are no longer dimmed with opacity.
- `Button`'s inner text no longer picks up the form `Label`'s color through a shared `.label` class.

The derived tokens use CSS relative color syntax (`oklch(from …)`, `color(from … srgb-linear …)`), supported in every evergreen browser since 2024.

**Light mode.** `data-color-scheme="light"` now forces light tokens. Before, it did nothing on a system set to dark.

The `bits-ui` peer range rises to `^2.19.5`. In 2.18.1, `DropdownMenu.Content` rendered without its `id`, so a `Menu` trigger's `aria-controls` pointed at nothing.
