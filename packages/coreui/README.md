# @sveltebuilder/coreui

Universal UI component library for [SvelteBuilder](https://github.com/cailenfisher/SvelteBuilder). Interactive components are built on [Bits UI](https://bits-ui.com) primitives; the rest are plain HTML — see [Bits UI or native](#bits-ui-or-native).

Every component in coreui is application-level UI — plain `label: string` props, no `diglossia` import, no dependency on an entity `id`. Entity components, which resolve their own copy, live in the domain modules (`@sveltebuilder/content`, `@sveltebuilder/logistic`), not here.

## Install

```sh
npm install @sveltebuilder/coreui bits-ui
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
- **Feedback & status:** `Alert`, `ProgressBar`, `Skeleton`, `Spinner`. `Alert` is static page content the page itself writes ("This supplier is inactive"); for the result of something the user just did, use the message system's `InlineNotification`
- **Messaging:** `createMessageBus`/`setMessageBus`/`getMessageBus`, `Toast`, `ToastRegion`, `InlineNotification`, `Banner`, `ConfirmDialog`, `MessageLiveRegion`
- **Forms:** `Field`, `Label`, `Input`, `Textarea`, `Checkbox`, `RadioGroup`/`RadioGroupItem`, `Switch`, `Select`/`SelectItem`, `DateTimePicker`, `useField`
- **Actions:** `Button`
- **Overlay:** `Dialog`, `Popover`, `Tooltip`, `Drawer`
- **Menus:** `Menu` and related sub-components
- **Navigation:** `LocalePicker`, `Pagination`
- **Data display:** `MetricCard`, `Timeline`, `Table`/`DataTable`

All interactive state (open/closed, checked, disabled, highlighted) is exposed via Bits UI `data-*` attributes, so component behavior stays consistent even if you write custom CSS against it.

## Bits UI or native

A component wraps a Bits UI primitive when it has interaction a native element doesn't give you: focus trapping, roving focus, typeahead, dismiss layers, positioning — `Accordion`, `Checkbox`, `Dialog`, `ConfirmDialog` (`AlertDialog`), `Drawer`, `Menu`, `Pagination`, `Popover`, `RadioGroup`, `Select`, `Switch`, `Tabs`, `Tooltip`.

Everything else is plain HTML on purpose:

- **Static display** — `Alert`, `Badge`, `Card`, `Tag`, `Skeleton`, `Spinner`, `MetricCard`, `Timeline`, `Table`. There is no behavior to borrow.
- **Native controls that are already the accessible primitive** — `Button`, `Input`, `Textarea`. Bits UI's own `Button` adds nothing over `<button>`.
- **`DateTimePicker`** uses `<input type="datetime-local">`: it handles date *and* time (Bits UI's date pickers are date-only), and gets the platform's mobile picker and screen-reader support for free.
- **`LocalePicker`** uses `<select>`, so it posts and works before hydration and gets the native picker on small screens.
- **`Avatar`** is an `<img>` with a CSS fallback; the image-loading state Bits UI tracks isn't needed for it.
- **Messaging surfaces** (`Toast`, `Banner`, `InlineNotification`, `MessageLiveRegion`) sit on coreui's own message bus.

## Copy

Every string a component shows comes in as a prop, and none has an English default: a default would ship English to screen-reader users in every other locale. Strings that are accessible names are required — `Dialog` and `Drawer` take `closeLabel`; `ConfirmDialog` takes `confirmLabel` and `cancelLabel`; `Pagination` takes `previousLabel`, `nextLabel` and `label`; `DataTable` takes one `labels` object; `Spinner` and `ProgressBar` take `label`; a removable `Tag` takes `removeLabel`. Optional text such as `Select`'s `placeholder` simply renders nothing when omitted. The messaging surfaces share one set of labels, passed once to `createMessageBus({ labels })` and read by `Toast`, `ToastRegion`, `Banner` and `InlineNotification` from context — see `MessageLabels` for the keys.

## Attributes

The component surface is closed: a component takes the props its type declares and nothing else.
Only `Input`, `Textarea` and `Button`, which wrap one native element, pass other attributes through
to it. Anything another component needs from its caller (an accessible name, a `name` for form
submission, a `class`) is a declared prop. Opening the surface later is additive; closing it after
1.0 would not be. A custom control inside a `Field` calls `useField()` and spreads the result on its focusable
element (`<input {...useField()} />`): it gets the Field's `id`, `aria-describedby`, `aria-invalid`,
`required` and `disabled`, typed as `FieldControl`.

## Part of the SvelteBuilder ecosystem

coreui is the shared UI foundation every SvelteBuilder domain module builds on — domain modules never reach past coreui to Bits UI directly. See the [SvelteBuilder README](https://github.com/cailenfisher/SvelteBuilder) for the full architecture.
