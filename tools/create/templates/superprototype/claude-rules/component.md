---
paths:
  - "src/**/*.svelte"
  - "src/**/*.css"
---

# Components, coreui, styling and accessibility

## Two kinds of component

| Kind                                                 | i18n                                                    | Props                                                                       |
| ---------------------------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------- |
| **Application UI** (buttons, fields, layout, coreui) | Never imports `diglossia`                               | Plain `label: string` props and snippets; the caller passes resolved text   |
| **Entity components** (`TicketCard`, `TicketRow`)    | `const dictionary = dictionaryProp ?? getDictionary();` | The entity (no copy fields) plus optional `dictionary?: DictionaryInstance` |

An entity component resolves its own copy with
`dictionary.localText('name', 'ticket', ticket.id)`. When an entity component renders another
entity component, **pass `dictionary` down**, or the child falls back to the global dictionary,
which doesn't contain scoped copy, and renders `[missing:]`.

## coreui

Check `@sveltebuilder/coreui` before building any UI: its README
(`node_modules/@sveltebuilder/coreui/README.md`) lists every component, and each one's props
are in `node_modules/@sveltebuilder/coreui/dist/<Component>/`. Read them rather than guessing. Wrap form controls in `Field` (which wires
up the label, `hint` and `error` with the right `aria-describedby`). Use `InlineNotification`
for a form error and the message bus (`getMessageBus()`) for toasts. The admin's locale and copy
editors are this project's own, in `src/lib/Locale/`, `src/lib/LocalText/` and
`src/lib/LocalTextLink/`.

If something reusable is missing, build it in the folder of the concept it represents
(`src/lib/Ticket/TicketCard.svelte`, a child concept nested inside its parent's folder) with the
same conventions, and tell the user it might belong in coreui. Group components by concept, never
by kind: no `components/`, `forms/` or `utils/` folders.

## Styling

- Theme through the 11 tokens in the `:root` block of `src/app.css`: `--brand`, `--chrome`,
  `--danger`, `--warning`, `--success`, `--info`, `--font`, `--font-mono`, `--font-size-base`,
  `--leading-base`, `--radius`. Never assign the derived tokens (`--brand-hover`,
  `--surface-raised`, …). See
  [Theming coreui](https://github.com/cailenfisher/SvelteBuilder/blob/main/docs/coreui-theming.md).
- **No `<style>` blocks and no `:global`.** Styles are plain CSS files. A screen, layout or
  component imports its own stylesheet, named after its root block and placed beside it:
  `import './ticket-list-screen.css';` in `src/routes/ticket/+page.svelte`, or
  `src/lib/Ticket/ticket.css` (one per concept folder) imported by the components in that folder.
  They stay unlayered, so they override coreui's layered rules.
- **Every selector names the file's own block, and every element it reaches has a class.** The
  stylesheet applies to the whole app, so `.ticket-card__body p` would also hit the paragraphs of
  any component rendered inside; write `.ticket-card__summary` on the element instead. Reach into a
  coreui component only through its public classes (`.ticket-card .badge`).
- A screen's root block is its view type with `View` replaced by `Screen`
  (`TicketListView` → `.ticket-list-screen`), so it never collides with a component's block.
- Use tokens (`var(--space-4)`, `var(--text-soft)`, `var(--radius)`) rather than raw colors and
  pixel values, so dark mode and re-theming keep working.
- Global overrides of coreui components are unlayered rules at the bottom of `app.css`,
  targeting coreui's classes and data attributes. No `!important`.
- Interactive state is expressed in data attributes (`[data-state='open']`, `[data-disabled]`),
  never toggled classes. Dark mode is `data-color-scheme` on `<html>`.
- CSS classes are `kebab-case` BEM: `.ticket-list-screen__header`. Hide text visually but keep
  it for screen readers with `.visually-hidden` from `src/utilities.css`.

## Accessibility (WCAG 2.2 AA)

- Semantic elements first: `<button>` for actions, `<a>` for navigation, `<nav>`, `<main>`,
  `<table>` for tabular data, headings in order. ARIA only when HTML can't express it.
- Every input has a visible label (`Field` does this). Errors are announced and tied to the field.
- Everything works by keyboard, with a visible focus indicator. Don't remove outlines.
- Color is never the only signal. Pair status color with text or an icon (`Badge` takes its text as content).
- Images have meaningful `alt`, or `alt=""` when decorative.
- Each page sets a localized `<title>` in `<svelte:head>`.
- When you change `--brand` or a status color, check its contrast.
