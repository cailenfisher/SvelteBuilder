# Theming CoreUI

## Philosophy

SvelteBuilder exposes a small, deliberate set of CSS custom properties — the tokens your team will actually configure. Brand color, status colors, typography, border radius, and a spacing unit. That's it.

CoreUI components reference these tokens but never define them. Your project defines them. The browser's cascade wires everything together. No build step, no config file, no plugin.

---

## Setup

### 1. Import the default tokens

CoreUI ships a `tokens.css` file containing production-safe defaults for every primitive. Import it at the top of your project's global stylesheet.

```css
/* src/app.css */
@import '@sveltebuilder/coreui/styles/tokens.css';
```

### 2. Override what you need

Add a `:root` block after the import and set only the tokens you want to change. Anything you don't override keeps its default.

```css
/* src/app.css */
@import '@sveltebuilder/coreui/styles/tokens.css';

:root {
  --color-brand: #0f5a9c;
  --color-brand-subtle: #e8f1fa;
  --font-family-base: 'Inter', sans-serif;
  --radius-base: 4px;
}
```

### 3. Import your stylesheet in the root layout

```svelte
<!-- src/routes/+layout.svelte -->
<script>
  import '../app.css';
</script>

<slot />
```

That's all. Every CoreUI component across your application will reflect your tokens automatically.

---

## Configurable Primitives

| Token | Default | Purpose |
|---|---|---|
| **Brand** | | |
| `--color-brand` | `#2563eb` | Primary interactive and action color |
| `--color-brand-subtle` | `#eff6ff` | Hover states and brand-tinted backgrounds |
| **Neutral** | | |
| `--color-neutral-50` | `#f9fafb` | Near-white surface |
| `--color-neutral-100` | `#f3f4f6` | Light background, zebra rows |
| `--color-neutral-200` | `#e5e7eb` | Borders, dividers |
| `--color-neutral-400` | `#9ca3af` | Placeholder text, disabled states |
| `--color-neutral-700` | `#374151` | Secondary text |
| `--color-neutral-900` | `#111827` | Primary text |
| **Status** | | |
| `--color-danger` | `#dc2626` | Destructive actions, errors |
| `--color-danger-subtle` | `#fef2f2` | Error backgrounds, inline error fields |
| `--color-warning` | `#d97706` | Caution indicators |
| `--color-warning-subtle` | `#fffbeb` | Warning backgrounds |
| `--color-success` | `#16a34a` | Confirmation, positive states |
| `--color-success-subtle` | `#f0fdf4` | Success backgrounds |
| `--color-info` | `#0284c7` | Informational, neutral alerts |
| `--color-info-subtle` | `#f0f9ff` | Info backgrounds |
| **Typography** | | |
| `--font-family-base` | `system-ui, sans-serif` | Body and UI text |
| `--font-family-mono` | `ui-monospace, monospace` | Code, data, reference values |
| `--font-size-base` | `16px` | Root font size (rem anchor) |
| `--font-scale` | `1.25` | Type scale ratio |
| **Shape** | | |
| `--radius-base` | `6px` | Border radius used across all components |
| **Density** | | |
| `--space-unit` | `4px` | Base spacing unit; all component spacing is multiples of this |
| **Accessibility** | | |
| `--color-focus-ring` | `#2563eb` | Keyboard focus indicator |
| `--shadow-card` | `0 1px 3px rgb(0 0 0 / 0.1)` | Elevation for cards and overlays |

> **Note:** All default values ship with verified WCAG AA contrast. If you override status or brand colors, you are responsible for verifying contrast compliance.

---

## Per-Tenant Theming (SSR / White-Label)

If your brand tokens come from a data source at runtime — for example, a white-label application where each tenant has their own brand color — inject an inline `<style>` tag in your root layout instead of (or in addition to) `app.css`.

```svelte
<!-- src/routes/+layout.svelte -->
<script>
  import '../app.css';

  export let data; // tenant config loaded in +layout.server.ts
</script>

<svelte:head>
  <style>
    :root {
      --color-brand: {data.tenant.brandColor};
      --color-brand-subtle: {data.tenant.brandColorSubtle};
    }
  </style>
</svelte:head>

<slot />
```

The inline `<style>` block on `:root` overrides the static values from `app.css` for that page render. The rest of your tokens remain as configured in `app.css`. No other changes are required — CoreUI components respond to the change automatically.

---

## What You Cannot Configure

The semantic and component token layers — the internal variables CoreUI uses to wire primitives to specific component roles — are not part of the public API. Overriding them directly is unsupported and may break across library updates.

If a component's visual behavior cannot be achieved by configuring the primitives above, [open an issue](https://github.com/cailenfisher/SvelteBuilder/issues) describing the use case.
