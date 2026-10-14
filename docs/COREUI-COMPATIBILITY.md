# COREUI-COMPATIBILITY.md — what `@sveltebuilder/coreui` promises from 1.0

This is the compatibility policy called for by [`COREUI-1.0.md`](./COREUI-1.0.md), stage 4. From
1.0.0 it decides whether a change is a patch, a minor or a major. Before 1.0 it describes the
target: the names below are the 1.0 names from [`conformance-manifest.md`](./conformance-manifest.md),
and some do not exist in the code yet.

---

## 1. The public API

Everything in this section is covered by semver. Anything not listed here is internal and may change
in any release.

- **Exports** from `@sveltebuilder/coreui`: every component, function, constant and type, and its
  name.
- **Component props:** each prop's name, type, whether it is required, and its default.
- **Callbacks:** each callback's name, its arguments, and when it fires.
- **Snippets:** each snippet prop's name and the parameters it receives.
- **Bindable values:** which props accept `bind:`.
- **Field integration:** what each control takes from a surrounding `Field` (see `useField()`'s doc
  comment), and `useField()` and `FieldContext` themselves.
- **The CSS surface** listed in section 4: classes, modifiers, data attributes and tokens.
- **Accessibility guarantees:** the role, accessible name source and keyboard behaviour each
  component provides. Removing one is breaking even when no type changes.
- **Peer dependency ranges.**

**Not public:**

- DOM structure: how elements nest, and any element without a listed class. Write selectors against
  one listed class or data attribute, not descendant chains such as `.card > div`.
- Element ids. They are generated, and differ per instance and per render.
- Any class, token or file not listed in section 4, including everything in `_internal.css` that
  section 4 does not name.
- Undocumented component behaviour that contradicts the documented behaviour. Fixing it is a
  patch.

## 2. What each kind of change is

| Change | Release |
| --- | --- |
| Bug fix that keeps the public API | patch |
| Accessibility fix: an added or corrected ARIA attribute, role or keyboard behaviour | patch |
| New component, export, optional prop, callback, snippet, class, modifier or readable token | minor |
| Widening a prop's type (accepting more values) | minor |
| Widening a peer range | minor |
| Deprecating anything (see section 3) | minor |
| Removing or renaming an export, prop, callback, snippet, class, modifier, data attribute or token | major |
| Making an optional prop required, or narrowing a prop's type | major |
| Changing a default, or when a callback fires | major |
| Changing what a control takes from `Field` | major |
| Raising a peer floor (Svelte, bits-ui, `@internationalized/date`) or dropping a supported browser | major |
| Removing an accessibility guarantee | major |

Two cases need judgement:

- **A visual change through the public CSS surface** (a new default padding, a changed derived
  colour) is a minor if the class and token names stay the same. It is a major only if a reasonable
  override written against section 4 stops applying.
- **A fix that changes rendered markup** is a patch when it only touches what section 1 calls
  internal. When it removes a listed class or data attribute, it is a major, however small the fix.

The modules (`@sveltebuilder/content`, `@sveltebuilder/logistic`) peer on coreui with a caret range.
From 1.0 every coreui minor is inside that range, so a coreui minor no longer forces a major on them.
That ends the cascade recorded in `DEFERRED.md`.

## 3. Deprecation

- A deprecation is announced in the changeset, so it reaches the changelog, and marked `@deprecated`
  in the type or prop's doc comment, so editors show it.
- A deprecated prop or component logs one development-mode console warning naming its replacement.
  It never warns in production.
- A deprecated item keeps working until the next major, and for at least one minor release before
  that major ships.
- The 1.0 release itself has no deprecated aliases. Renames made on the way to 1.0 are listed in
  `docs/MIGRATION-2.0.md`.

## 4. The public CSS surface

The scaffold imports coreui's stylesheets into cascade layers, and application CSS overrides them
unlayered (see [`coreui-theming.md`](./coreui-theming.md)). These are the names such overrides may
target.

**The stylesheet.** `@sveltebuilder/coreui/styles/components.css` is the one entry point, imported
`layer(components)`. It lists one stylesheet per component folder, which ship in `dist/` beside
the components; those file paths are not public, and neither is the order of the list beyond
"coreui before any domain module". Components carry no `<style>` blocks, so a page that does not
import the stylesheet renders them unstyled.

**Table parts are styled through their components.** Row borders, hover and cell padding target
`.table-row`, `.table-cell` and `.table-header-cell`, not `tr`, `td` and `th`, so a row or cell
written as a plain element inside `TableBody` is unstyled. Use `TableRow`, `TableCell` and
`TableHeaderCell`.

### Naming rule

- **Root:** each exported component's root element carries the component's name in kebab case
  (`DateTimePicker` → `.date-time-picker`). Where several components deliberately share one root,
  that is listed below.
- **Part:** a styled element inside a component is `<root>__<part>` (`.dialog__title`). A part is
  public when it is listed below.
- **Modifier:** a variant, size or state expressed as a class is `<root>--<modifier>`
  (`.button--primary`, `.badge--sm`), or `<root>__<part>--<modifier>` when it styles one part
  (`.select__trigger--sm`, `.checkbox__control--md`).
- **State from Bits UI** is a data attribute, never a class (CLAUDE.md, guardrail 9).

### Classes

| Component | Root | Parts | Modifiers |
| --- | --- | --- | --- |
| Accordion | `.accordion` | | |
| AccordionItem | `.accordion-item` | `__header`, `__trigger`, `__title`, `__chevron`, `__content`, `__body` | |
| Alert | `.alert` | `__icon`, `__title`, `__body`, `__content` | `--danger`, `--info`, `--success`, `--warning` |
| Avatar | `.avatar` | `__image`, `__fallback` | `--xs`, `--sm`, `--md`, `--lg`, `--xl` |
| Badge | `.badge` | | `--default`, `--brand`, `--danger`, `--info`, `--success`, `--warning`, `--sm`, `--md`, `--lg` |
| Banner | `.banner` | `__icon`, `__summary`, `__detail`, `__body`, `__actions`, `__action`, `__close` | `--danger`, `--info`, `--success`, `--warning` |
| Button | `.button` | `__leading`, `__text`, `__trailing`, `__spinner` | `--primary`, `--secondary`, `--ghost`, `--danger`, `--link`, `--sm`, `--md`, `--lg`, `--full`, `--loading` |
| Card | `.card` | `__header`, `__body`, `__footer` | `--padded` |
| Checkbox | `.checkbox` | `__control`, `__indicator`, `__icon`, `__label` | `__control--sm`, `__control--md` |
| DataTable | `.data-table` | `__empty`, `__footer` | |
| DateTimePicker | `.date-time-picker` | | |
| Dialog, ConfirmDialog (shared) | `.dialog` | `__overlay`, `__trigger`, `__header`, `__title`, `__description`, `__body`, `__footer`, `__close` | `--sm`, `--md`, `--lg`, `--xl`, `--full` |
| Divider | `.divider` | | `--horizontal`, `--vertical` |
| Drawer | `.drawer` | `__overlay`, `__trigger`, `__header`, `__title`, `__description`, `__body`, `__footer`, `__close` | `--left`, `--right`, `--bottom` |
| Field | `.field` | `__label`, `__required`, `__control`, `__hint`, `__error` | |
| InlineNotification | `.inline-notification` | `__icon`, `__summary`, `__detail`, `__detail-toggle`, `__reference`, `__body`, `__actions`, `__action`, `__close` | `--danger`, `--info`, `--success`, `--warning` |
| Label | `.label` | `__required` | |
| LocalePicker | `.locale-picker` | `__label`, `__select` | |
| Menu family (shared) | `.menu` | `__trigger` | |
| MenuItem, MenuCheckboxItem, MenuRadioItem, MenuSub trigger (shared) | `.menu-item` | `__leading`, `__check`, `__radio-dot`, `__sub-arrow` | `--checkbox`, `--radio`, `--sub-trigger` |
| MenuSub content | `.menu` | | `--sub` |
| MenuGroup, MenuRadioGroup, MenuLabel, MenuSeparator | `.menu-group`, `.menu-radio-group`, `.menu-label`, `.menu-separator` | | |
| MessageLiveRegion | `.message-live-region` | | |
| MetricCard | `.metric-card` | `__label`, `__value`, `__trend`, `__description` | `__trend--positive`, `__trend--negative`, `__trend--neutral` |
| Pagination | `.pagination` | `__button`, `__pages`, `__ellipsis` | `__button--page`, `__button--navigation` |
| Popover | `.popover` | `__trigger`, `__arrow` | |
| ProgressBar | `.progress-bar` | `__track`, `__indicator` | `--sm`, `--md`, `--lg`, `--indeterminate` |
| RadioGroup | `.radio-group` | | `--horizontal`, `--vertical` |
| RadioGroupItem | `.radio-group-item` | `__control`, `__label` | |
| Select | `.select` | `__trigger`, `__value`, `__chevron`, `__content`, `__viewport`, `__scroll-button` | `__trigger--sm`, `__trigger--md`, `__trigger--lg`, `__trigger--error`, `__scroll-button--up`, `__scroll-button--down` |
| SelectItem | `.select-item` | | |
| Skeleton | `.skeleton` | | `--inline` |
| Spinner | `.spinner` | `__svg`, `__track`, `__arc` | `--sm`, `--md`, `--lg` |
| Switch | `.switch` | `__control`, `__thumb`, `__label` | `__control--sm`, `__control--md` |
| Table | `.table` | `__element`, `__caption` | `__element--sticky-header` |
| TableHead, TableBody, TableFoot, TableRow, TableCell | `.table-head`, `.table-body`, `.table-foot`, `.table-row`, `.table-cell` | | `.table-cell--end` |
| TableHeaderCell | `.table-header-cell` | `__sort-trigger`, `__sort-icon`, `__content` | `--sortable` |
| Tabs | `.tabs` | | `--horizontal`, `--vertical` |
| TabsList, TabsTrigger, TabsContent | `.tabs-list`, `.tabs-trigger`, `.tabs-content` | | |
| Tag | `.tag` | `__label`, `__remove` | `--default`, `--brand`, `--danger`, `--info`, `--success`, `--warning` |
| Timeline | `.timeline` | | |
| TimelineItem | `.timeline-item` | `__dot`, `__body`, `__content`, `__label`, `__meta`, `__timestamp` | `--current` |
| Toast | `.toast` | `__icon`, `__summary`, `__detail`, `__detail-toggle`, `__reference`, `__body`, `__actions`, `__action`, `__close`, `__fill`, `__timer` | `--critical`, `--danger`, `--info`, `--success`, `--warning`, `__action--undo` |
| ToastRegion | `.toast-region` | `__queue` | |
| Tooltip | `.tooltip` | `__trigger`, `__arrow` | |

`BarcodeInput` moves to `@sveltebuilder/logistic` (decision A-2), so its classes are logistic's, not
coreui's. `.input` and `.textarea` are chrome classes the scaffold defines in `chrome.css`. coreui
styles their `--sm`/`--md`/`--lg` and `--error` modifiers, and those modifiers are public.

### Data attributes

Set by Bits UI, and public because coreui's own styles key on them: `data-state` (`open`, `closed`,
`checked`, `indeterminate`, `active`), `data-disabled`, `data-highlighted`, `data-selected`,
`data-placeholder`, and `data-side` (`top`, `right`, `bottom`, `left`). coreui also sets
`data-disabled` on the wrapping element of `Checkbox`, `Switch` and `Field`.

### Tokens

- **Assignable:** the 11 tokens in `tokens.css`: `--brand`, `--chrome`, `--danger`, `--warning`,
  `--success`, `--info`, `--font`, `--font-mono`, `--font-size-base`, `--leading-base`, `--radius`.
- **Readable, not assignable:** every derived token in `_internal.css`. These are the scales
  (`--space-*`, `--text-xs` … `--text-4xl`, `--weight-*`, `--leading-*`, `--tracking-*`,
  `--radius-*`, `--shadow-*`, `--z-*`, `--duration*`, `--ease*`) and the semantic colours
  (`--surface*`, `--text*`, `--border*`, `--link-text`, `--overlay-bg`, `--disabled-*`, and
  `--brand-*` plus each status colour's `-soft`, `-text`, `-border`, `-fg` and `-hover`). Scaffolded
  screens read them, so removing or renaming one is a major. Assigning one is unsupported: its value
  is derived, and an assignment can break the derivation.
- **Private:** tokens prefixed `--_` (CLAUDE.md, _Private component tokens_). Never part of the API.

## 5. Support floors

| Dependency | Floor | Why |
| --- | --- | --- |
| Svelte | `^5.33.0` | bits-ui 2.19.5 requires it; coreui itself needs 5.20 for `$props.id()` |
| bits-ui | `^2.19.5` | 2.18.1 rendered menu content without the id its trigger's `aria-controls` named |
| `@internationalized/date` | `^3.8.1` | bits-ui's own peer range |

| Browser | Floor | Why |
| --- | --- | --- |
| Chrome, Edge | 119 | CSS relative colour syntax (`oklch(from var(--chrome) …)`) derives the colour tokens |
| Firefox | 128 | relative colour syntax |
| Safari, iOS Safari | 18 | complete relative colour syntax; earlier versions shipped a partial implementation |

The accessibility workflow audits Chromium. WebKit and Firefox join it in Phase 12 of the
conformance plan. Until then, the Firefox and Safari floors come from the features coreui uses, not
from a test run.
