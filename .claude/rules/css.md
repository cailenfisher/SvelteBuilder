---
paths:
  - "**/*.css"
  - "**/*.svelte"
  - "scripts/css-check.mjs"
---

# CSS style system

## The scaffold is the integrator

`@sveltebuilder/coreui` and every domain module ship stylesheets but never self-apply them. The
scaffold `app.css` imports each package's stylesheet into the correct layer position. This is
intentional: the scaffold controls the cascade; the libraries supply the rules.

## Layer cascade

All styles in a SvelteBuilder application flow through named CSS cascade layers in this order:

```
base  →  chrome  →  components  →  utilities  →  unlayered (developer)
```

The layer order is declared explicitly at the top of `app.css` before any imports — this
fixes the priority order regardless of import sequencing:

```css
@layer reset, tokens, base, chrome, components, utilities;
```

Unlayered CSS always wins over every `@layer` block regardless of specificity. This is the
mechanism that makes the entire visual system overridable by a developer after install — no
`!important`, no specificity fights.

The scaffold `app.css` wires everything together:

```css
@layer reset, tokens, base, chrome, components, utilities;

@import '@sveltebuilder/coreui/styles/tokens.css'; /* not layered — tokens are a base */
@import '@sveltebuilder/coreui/styles/base.css' layer(base);
@import './chrome.css' layer(chrome);
@import '@sveltebuilder/coreui/styles/components.css' layer(components);
@import '@sveltebuilder/logistic/styles/components.css' layer(components); /* one per module */
@import './utilities.css' layer(utilities);

/* developer overrides below — unlayered, always wins */
```

The create CLI writes each selected module's line after coreui's, so a module rule that styles a
coreui part wins a tie by order. `reset` is a reserved layer slot; no file targets it yet.

## What each layer owns

| Layer        | File(s)                                 | Owns                                                                                                    |
| ------------ | --------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| _(none)_     | `packages/coreui/styles/tokens.css`     | CSS custom properties (design tokens) — not layered                                                     |
| `base`       | `packages/coreui/styles/base.css`       | Box-sizing reset, `html` typography defaults, global `:focus-visible` ring, `prefers-reduced-motion`    |
| `chrome`     | `src/chrome.css` (scaffold)             | Structural base for element classes (`.input`, `.button`, `.card`, etc.) plus all interactive field states |
| `components` | each package's `styles/components.css`  | Every coreui and domain-module component's styles, coreui first                                         |
| `utilities`  | `src/utilities.css` (scaffold)          | Single-purpose classes such as `.visually-hidden`                                                       |
| _(none)_     | the app's screens, layouts and components, and `app.css` | Each screen's and app component's own stylesheet, theme overrides                      |

**Why `chrome` owns field interaction states:** focus, error, disabled, and read-only rules
modify the same `.input`/`.textarea` classes that `chrome` establishes. Keeping them together
in one layer and one file removes the ordering dependency that made `state` a separate layer.

## Plain stylesheets

BEM class names scope every rule, which is what BEM was designed for, so no component uses Svelte's
compiled scoping: no `<style>` blocks and no `:global`, anywhere. Styles are plain CSS files the page
links.

- **One stylesheet per concept folder**, named after the folder in kebab case and placed in it:
  `Table/table.css` holds `.table`, `.table-row`, `.table-cell` and the rest of the folder's
  blocks; a nested concept has its own (`Article/ArticleBlock/article-block.css`). A route
  directory works the same way, its stylesheet named after its root block.
- **A package's stylesheets are listed in its `src/lib/components.css`**, exported as
  `<package>/styles/components.css` and layered by the app (above). Its order is the cascade
  order within the layer.
- **An app's own stylesheets are imported by the component that renders the block**
  (`import './supplier-list-screen.css';`) and stay unlayered, like the rest of the developer's CSS.
- **Every selector names its own block, and every element it reaches is named by a class.** A
  rule in a plain stylesheet applies to the whole app, so `.article-card__dek p` would also hit
  the paragraphs of every child component; give the element a class (`__dek-text`). A rule may
  reach into a child component only through that child's public classes
  (`.article-card__media .media-asset-figure__img`).
- **A screen's root block is its view-model type, with `View` replaced by `Screen`**:
  `InboundReceiptWarehouseQueueView` renders `.inbound-receipt-warehouse-queue-screen`. The
  suffix keeps it from colliding with the component the screen renders (`.article-detail`). A
  base-template screen with no view type is named after its concept and role
  (`.locale-admin-list-screen`); a layout after its route group (`.admin-layout`).
- **Visual rules are overridable.** A coreui stylesheet may hold anything; there is no separate
  place for structural rules any more.

`pnpm css:check` (`scripts/css-check.mjs`, also in the Test workflow) enforces all of this, and
reports a class no component mentions, which replaces svelte-check's unused-selector warning.

**Class names are BEM, and they are public API.** A component's root class is its name in kebab
case (`.date-time-picker`). Every styled element inside it is `<root>__<part>`, and every variant,
size or class-expressed state is `<root>--<modifier>`. Never give an internal element a bare
generic class (`.icon`, `.body`, `.label`): bare names collide with other components' roots and
with application CSS. The full list, and what changing it costs, is in
`docs/COREUI-COMPATIBILITY.md`.

```css
.alert__icon { … }
.card__body  { … }
.toast__close:hover { … }
.button--primary { … }
```

**CSS custom property bridge for inherited state.** When a Bits UI data-attribute on a parent
element needs to affect a non-Bits child element, use a CSS custom property as the bridge:

```css
/* declare on the state-carrying parent — --_ prefix marks it private */
.accordion-item__trigger {
  --_icon-rotate: 0deg;
}
.accordion-item__trigger[data-state='open'] {
  --_icon-rotate: 180deg;
}

/* consume via inheritance in the child */
.accordion-item__chevron {
  transform: rotate(var(--_icon-rotate, 0deg));
}
```

This keeps a parent's state reaching a child through inheritance rather than a selector that
depends on the parent's markup.

**Private component tokens (`--_` prefix).** When a component needs an internal CSS variable
that is not part of the public theming surface — to share a value between two selectors within
one component's ruleset in its stylesheet, as `--_icon-rotate` does above — name it with a `--_`
prefix. The `--_` prefix signals "internal implementation detail." Do not advertise these in docs or
override them from application CSS. If a value needs to be themeable, it should chain to a
public semantic token instead.

## Theme and color scheme via `data-*`

Dark mode and theme variants are driven by `data-*` attributes on ancestor elements, never by
CSS class toggles. The token overrides in `@sveltebuilder/coreui/styles/_internal.css` respond
to these attributes:

| Attribute                   | Effect                                           |
| --------------------------- | ------------------------------------------------ |
| `data-color-scheme="dark"`  | Force dark mode regardless of system preference  |
| `data-color-scheme="light"` | Force light mode regardless of system preference |
| _(attribute absent)_        | Follow `prefers-color-scheme` system preference  |

Set `data-color-scheme` on `<html>` or the root layout element. Read and persist the user's
preference with JavaScript, then toggle the attribute.

```ts
// force dark
document.documentElement.setAttribute('data-color-scheme', 'dark');

// follow system
document.documentElement.removeAttribute('data-color-scheme');
```

## Bits UI data-attribute wiring

All interactive state for Bits UI components **must** use data attributes, not class toggles.
Bits UI sets these automatically; style rules target them directly:

```css
[data-state='open']       { … }   /* open/closed */
[data-state='checked']    { … }   /* checkbox, radio */
[data-highlighted]        { … }   /* menu items, listbox options */
[data-disabled]           { … }   /* disabled state */
[data-selected]           { … }   /* select options */
[data-placeholder]        { … }   /* select value placeholder */
```

Use a CSS custom property bridge (above) when the data attribute on a parent must affect a
non-Bits child element. **Never** use a Svelte snippet child to read Bits UI state and apply a class manually when the
data attribute already carries that state. Pseudo-elements driven by data-attribute selectors
are the correct pattern for visual indicators (e.g., radio dot via `::after`).
