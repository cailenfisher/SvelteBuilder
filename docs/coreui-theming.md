# Theming CoreUI

## Philosophy

SvelteBuilder exposes a small, deliberate set of CSS custom properties: the tokens a team will
actually configure. One brand color, one neutral, four status colors, two font stacks, a root
size and line height, and a corner radius. That's it.

Everything else (surfaces, borders, text shades, hover and active states, tinted backgrounds,
dark mode) is derived from those with `color-mix()` inside coreui. Change one public token and
every component that depends on it follows. No build step, no config file, no plugin.

---

## Setup

A scaffolded project is already wired. `src/app.css` declares the cascade-layer order, imports
coreui's stylesheets into their layers, and has a `:root` block for your overrides:

```css
/* src/app.css */
@layer reset, tokens, base, chrome, components, utilities;

@import '@sveltebuilder/coreui/styles/tokens.css';
@import '@sveltebuilder/coreui/styles/base.css' layer(base);
@import './chrome.css' layer(chrome);
@import '@sveltebuilder/coreui/styles/components.css' layer(components);

/* ---- Token overrides ---- */
:root {
  --brand: #0f5a9c;
  --chrome: #dde3ec;
  --font: 'Inter', system-ui, sans-serif;
  --radius: 4px;
}
```

Set only the tokens you want to change; anything you leave out keeps its default. The root
layout imports `app.css` once, and every coreui component reflects your tokens from then on.

If you are wiring coreui into an app that wasn't scaffolded, copy the four lines above. The layer
declaration must come first so the order holds however the imports are sequenced. `tokens.css` is
deliberately unlayered.

---

## Configurable Tokens

These 11 properties, defined in `@sveltebuilder/coreui/styles/tokens.css`, are the complete
public theming surface.

| Token              | Default                                | Purpose                                                                                                  |
| ------------------ | -------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| **Brand**          |                                        |                                                                                                          |
| `--brand`          | `#2563eb`                              | Primary actions, links, selected states. Hover, active, soft-tint and text variants are derived from it. |
| **Neutral**        |                                        |                                                                                                          |
| `--chrome`         | `#e2e8f0`                              | The single neutral reference. Light-mode borders, raised surfaces and every text shade derive from it.  |
| **Status**         |                                        |                                                                                                          |
| `--danger`         | `#dc2626`                              | Destructive actions, errors                                                                              |
| `--warning`        | `#d97706`                              | Caution indicators                                                                                       |
| `--success`        | `#16a34a`                              | Confirmation, positive states                                                                            |
| `--info`           | `#0284c7`                              | Informational, neutral alerts                                                                            |
| **Typography**     |                                        |                                                                                                          |
| `--font`           | `system-ui, -apple-system, sans-serif` | Body and UI text                                                                                         |
| `--font-mono`      | `ui-monospace, monospace`              | Code, IDs, reference values                                                                              |
| `--font-size-base` | `1rem`                                 | Root font size, set on `<html>`. The type scale is in `rem`, so this scales all text. Spacing is fixed `px`. |
| `--leading-base`   | `1.5`                                  | Root line height                                                                                         |
| **Shape**          |                                        |                                                                                                          |
| `--radius`         | `6px`                                  | Corner radius used across all components                                                                 |

Each status color gets `-soft` (tinted background), `-text`, `-border`, `-hover` and `-fg`
(foreground on a solid fill) variants derived for it automatically.

> **Note:** The default values are chosen for WCAG AA contrast, though no automated check runs
> yet. If you override brand or status colors, you are responsible for checking contrast: at minimum white text on `--brand`, `--brand` as
> link text on the page background, and each status color as text.

---

## Dark Mode

Dark mode follows `prefers-color-scheme` with no configuration. In dark mode, surfaces, borders
and text switch to a fixed slate palette, and `--brand` and the status colors are re-tinted for
dark backgrounds. `--chrome` has no effect in dark mode.

To force a scheme, set `data-color-scheme` on `<html>` (or any ancestor):

| Attribute                   | Effect                                |
| --------------------------- | ------------------------------------- |
| `data-color-scheme="dark"`  | Dark, regardless of system preference |
| `data-color-scheme="light"` | Light, regardless of system preference |
| _(absent)_                  | Follow the system preference          |

```ts
document.documentElement.setAttribute('data-color-scheme', 'dark');
document.documentElement.removeAttribute('data-color-scheme'); // back to system
```

Persist the choice in a cookie and render the attribute from the server if you want the first
paint to match. Dark mode is never driven by a class toggle.

---

## Overriding a Specific Component

When the tokens can't express what you need, write ordinary CSS **after the imports in
`app.css`, outside any `@layer`**. Unlayered rules beat every layered rule regardless of
specificity, so there is no need for `!important`.

coreui components use plain class names (`.btn`, `.btn.primary`, `.card`, `.alert`, ...) and
express Bits UI state through data attributes (`[data-state='open']`, `[data-highlighted]`,
`[data-disabled]`), so target those:

```css
/* bottom of src/app.css */
.btn {
  letter-spacing: 0.02em;
}

.accordion-trigger[data-state='open'] {
  background: var(--brand-soft);
}
```

The class names for each component are in `@sveltebuilder/coreui/styles/components.css`.

Reading a derived token such as `var(--brand-soft)` or `var(--text-soft)` in your own rules is
fine. **Assigning** one is not supported (see below).

---

## Per-Tenant Theming (SSR / White-Label)

If brand tokens come from a data source at runtime, for example a white-label application where
each tenant has its own brand color, load them in `+layout.server.ts` and emit a `:root` override
from the root layout:

```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import '../app.css';

  let { data, children } = $props();
</script>

<svelte:head>
  {@html `<style>:root { --brand: ${data.tenant.brand}; }</style>`}
</svelte:head>

{@render children()}
```

Validate the value on the server before it reaches the page (for example, accept only
`#rrggbb`). It is written straight into a `<style>` element. Because the derived tokens are
computed from `--brand`, setting this one property re-themes buttons, links, focus states and
tints together.

---

## What You Cannot Configure

The derived tokens in `_internal.css` (`--brand-hover`, `--surface-raised`, `--text-soft`,
`--danger-border`, the spacing and type scales, and so on) are not part of the public API.
Assigning them directly is unsupported and may break across library updates.

If a component's visual behavior can't be achieved with the 11 tokens plus unlayered component
overrides, [open an issue](https://github.com/cailenfisher/SvelteBuilder/issues) describing the
use case.
