# @sveltebuilder/coreui

Universal UI component library for [SvelteBuilder](https://github.com/cailenfisher/SvelteBuilder), built on [Bits UI](https://bits-ui.com) primitives. Components are split into two kinds:

- **Application-level UI** (`Button`, `Input`, `Card`, layout chrome) — i18n-agnostic, plain `label: string` props, no dependency on `@sveltebuilder/hermes`.
- **Entity/domain UI** (`LocalTextLinkEdit`, admin editors) — imports `@sveltebuilder/hermes` and resolves localized copy from an entity `id`.

## Install

```sh
npm install @sveltebuilder/coreui @sveltebuilder/hermes bits-ui
```

Requires Svelte 5.

## Styles

coreui ships stylesheets but never self-applies them — your app imports them into its own CSS cascade layers:

```css
@layer reset, tokens, base, chrome, components, utilities;

@import '@sveltebuilder/coreui/styles/tokens.css'; /* not layered — tokens are a base */
@import '@sveltebuilder/coreui/styles/base.css' layer(base);
@import '@sveltebuilder/coreui/styles/components.css' layer(components);

/* your overrides below — unlayered CSS always wins */
```

Unlayered CSS beats every `@layer` block regardless of specificity, so anything you write in your own app CSS overrides coreui without `!important` or specificity fights.

Dark mode and theme variants are driven by a `data-color-scheme` attribute (`"dark"` | `"light"`) on `<html>` — omit it to follow `prefers-color-scheme`.

## Components

```ts
import { Button, Card, Input, Select, Table, DataTable, /* ...and more */ } from '@sveltebuilder/coreui';
```

- **Layout & display:** `Card`, `Divider`
- **Typography & decoration:** `Badge`, `Tag`, `Avatar`
- **Feedback & status:** `Alert`, `ProgressBar`, `Skeleton`, `Spinner`
- **Messaging:** `messageBus`, `Toast`, `ToastRegion`, `InlineNotification`, `Banner`, `ConfirmDialog`, `MessageAriaLive`
- **Forms:** `Field`, `Label`, `Input`, `Textarea`, `Checkbox`, `RadioGroup`/`RadioItem`, `Switch`, `Select`/`SelectItem`, `BarcodeInput`, `DateTimePicker`, `useField`
- **Actions:** `Button`
- **Overlay:** `Dialog`, `Popover`, `Tooltip`, `Drawer`
- **Menus:** `Menu` and related sub-components
- **Navigation:** `LocaleSwitcher`, `Pagination`
- **Data display:** `MetricCard`, `Timeline`, `StatusBadge`, `Table`/`DataTable`
- **Editing:** `BlockEditor`
- **LocalText admin:** `LocaleEdit`, `LocalTextLinkEdit`, `LocalTextEdit`

All interactive state (open/closed, checked, disabled, highlighted) is exposed via Bits UI `data-*` attributes, so component behavior stays consistent even if you write custom CSS against it.

## Part of the SvelteBuilder ecosystem

coreui is the shared UI foundation every SvelteBuilder domain module builds on — domain modules never reach past coreui to Bits UI directly. See the [SvelteBuilder README](https://github.com/cailenfisher/SvelteBuilder) for the full architecture.
