# COREUI-API-AUDIT.md — stage 1 of the road to coreui 1.0

The API audit called for by [`COREUI-1.0.md`](./COREUI-1.0.md), stage 1. It covers every public
export of `@sveltebuilder/coreui` at 0.2.x (65 components, the message bus, `useField`, and the
exported types and constants), plus the CSS surface consumers override.

**Method.** Props, defaults, bindable values, callbacks, snippets, rendered class names and literal
text were extracted from every component's source, then checked by hand. The CSS surface was taken
from `styles/components.css`. Package metadata was compared against what the code actually uses.
Audited 2026-10-08 against `main` at `3794a56`.

**How to read a finding.** Each has an ID, the evidence, why it matters for 1.0, a proposal, and
whether the fix is **breaking**. Breaking fixes belong in the single bundled release described at
the end. Non-breaking ones can ship as patches at any time, which also keeps the Changesets cascade
quiet (`docs/DEFERRED.md`).

The findings below are as audited. Each one's outcome, as of the conformance plan's Phase 12
(2026-10-15), is in the summary table's last column.

---

## Summary

| ID  | Finding                                                                      | Breaking fix? | Outcome |
| --- | ---------------------------------------------------------------------------- | ------------- | --- |
| A1  | 11 props, and the message-bus labels, default to English                     | Yes           | Changed (Phase 7): accessible names required, no English defaults; message bus takes a complete `MessageLabels` |
| A2  | `BlockEditor` has about 25 hard-coded English strings with no prop           | Yes           | Changed (Phase 3): moved to content as `ArticleBlockEditor`, copy from the dictionary |
| A3  | Locale editors ship English placeholders, one naming the retired blog module | No            | Changed (Phase 3): the editors moved to the base template, placeholders dropped |
| B1  | `BlockEditor` is article-shaped, not universal                               | Yes (move)    | Changed (Phase 3): `ArticleBlockEditor` in content |
| B2  | Locale-admin editors are diglossia-shaped                                    | Yes (move)    | Changed (Phase 3): moved to the base template (`LocaleFieldset` and the local-text forms) |
| B3  | `BarcodeInput` duplicates `Field` and is warehouse-shaped                    | Decide        | Changed (Phase 3): moved to logistic |
| B4  | `StatusBadge` is `Badge` with a `label` prop                                 | Yes (remove)  | Changed (Phase 3): removed; `Badge` instead |
| B5  | `Alert` and `InlineNotification` overlap                                     | Decide        | Kept: `Alert` is static page content, `InlineNotification` a message result; stated in the README |
| C1  | Callback names are inconsistent                                              | Yes           | Changed (Phase 7): `onRemove`, `MenuCheckboxItem.onCheckedChange`. Kept: `TableHeaderCell.onSort`, a request to sort with no value, unlike `DataTable`'s `onSortChange(key, direction)` |
| C2  | 11 bindable values have no change callback                                   | No (additive) | Changed (Phase 7): every bindable value has its change callback; behaviour specs check each fires once |
| C3  | Text arrives as `label`, `title`, `content`, `triggerLabel` or `children`    | Yes           | Changed (Phase 7): `MenuSub` and `Tooltip` take a `trigger` snippet |
| C4  | Severity is `danger` in some components and `error` in others                | Yes           | Changed (Phase 7): `danger` everywhere |
| C5  | 8 components take no `class` prop                                            | No (additive) | Changed (Phase 7): `class` on every styled root |
| C6  | Only 3 components forward other attributes                                   | Decide        | Kept closed, stated in the README (decision A-5) |
| D1  | No declared list of public class names                                       | Policy        | Changed: `docs/COREUI-COMPATIBILITY.md` lists the public classes |
| D2  | Internal class names collide with other components' root classes             | Yes           | Changed (Phases 7 and 10): BEM `component__part` throughout, enforced by `pnpm css:check` |
| D3  | 23 physical-direction declarations against 5 logical ones                    | No            | Changed: two physical declarations remain, both direction-neutral |
| E1  | Hard-coded element ids produce duplicates                                    | No            | Changed: `$props.id()` throughout; the live regions' unused fixed ids removed (Phase 12) |
| E2  | `Field` integration is partial, and its documentation is wrong               | No            | Changed (Phase 7): `Input`, `Textarea`, `Select`, `Checkbox`, `Switch`, `RadioGroup` and `DateTimePicker` read `Field`, as does logistic's `BarcodeInput` |
| E3  | `MenuLabel` outside a group throws and empties the menu                      | No            | Changed: `MenuLabel` renders outside a group (dev-kitchen showcases it) |
| F1  | Svelte peer floor is `^5.0.0`; the real floor is 5.33                        | Yes (peer)    | Changed (Phase 1): peer `svelte ^5.33.0` |
| F2  | `@internationalized/date` is required but undeclared                         | No            | Changed (Phase 1): declared as a peer |
| F3  | `useField` is exported but its return type is not                            | No            | Changed (Phase 1): `FieldContext` exported. Decided 2026-10-15: `useField` stays public, returning `FieldControl`; `FieldContext` becomes internal (lands in Phase 13; see `DEFERRED.md`) |
| F4  | Exported constants and English defaults need a decision                      | Decide        | Changed: `DEFAULT_MESSAGE_LABELS` no longer exported; `AUTO_DISMISS_MS` kept, it documents behaviour |
| G1  | 6 of 65 components carry any doc comment; README is 75 lines                 | No            | Open: reference documentation is COREUI-1.0 stage 4 |
| G2  | One test file for 65 components                                              | No            | Partly changed (Phase 12): behaviour specs in dev-kitchen for every interactive component, in three engines |

---

## A. Copy and i18n

### A1 — English defaults on props (breaking)

| Component     | Prop                                   | Default                                          |
| ------------- | -------------------------------------- | ------------------------------------------------ |
| Dialog        | `closeLabel`                           | `'Close'`                                        |
| Drawer        | `closeLabel`                           | `'Close'`                                        |
| ConfirmDialog | `confirmLabel`, `cancelLabel`          | `'Confirm'`, `'Cancel'`                          |
| Pagination    | `previousLabel`, `nextLabel`, `label`  | `'Previous page'`, `'Next page'`, `'Pagination'` |
| Select        | `placeholder`                          | `'Select an option…'`                            |
| Spinner       | `label`                                | `'Loading…'`                                     |
| ProgressBar   | `label`                                | `'Progress'`                                     |
| Tag           | `removeLabel`                          | `'Remove'`                                       |
| DataTable     | `emptyLabel`                           | `'No data'`                                      |
| BarcodeInput  | `placeholder`                          | `'Scan or type...'`                              |
| message bus   | `MessageBusOptions.labels` (`Partial`) | `DEFAULT_MESSAGE_LABELS`, all English            |

**Why it matters.** Most of these are accessible names (`closeLabel`, `removeLabel`, the
Pagination labels, Spinner and ProgressBar). A caller who omits one ships English to screen-reader
users in every locale, and no type error or lint warns them. That contradicts the repo's first
principle, and a 1.0 would make the defaults permanent.

**Proposal.** Make every user-facing string prop required, with no default. The bus's `labels`
becomes a required, complete `MessageLabels`, and `DEFAULT_MESSAGE_LABELS` stops being exported
(see F4). The base template already passes every bus label from the dictionary, so scaffolds lose
nothing.

### A2 — `BlockEditor` hard-coded English (breaking)

About 25 strings with no prop:

- block type names (`Paragraph`, `Heading`, … `Video`);
- the aria-labels `Article block editor`, `Content blocks`, `Block controls`, `Heading level`, and
  `Move block N up` / `down`, `Remove block N`, `Add block after block N`;
- the placeholders `… text…` and `https://…`;
- `✓ Asset selected`, `+ Add block`, `+ Add first block`;
- the embed provider names, the `Provider` and `URL` labels, and `select media asset in the media
panel`.

It is an application-level component (no dictionary), so it cannot resolve copy itself.

**Proposal.** A single required `labels` prop (one typed object, like the message bus's), with
functions for the positional strings: `moveUp: (position) => string`. Decided together with B1,
since moving the component changes who supplies the copy.

### A3 — Locale editors' placeholders (not breaking)

`LocaleEdit` hard-codes the placeholders `en` and `English`. `LocalTextLinkEdit` hard-codes
`admin.navigation.example` and `blog, product, …`; the blog module was retired on 2026-07-06.

**Proposal.** Take placeholders as optional props, or drop them. Resolved with B2.

---

## B. What belongs in coreui

The coreui promotion rule (CLAUDE.md) says a component belongs here when at least two domain
modules could use it. These fail or strain that test. Moving a component out after 1.0 is breaking,
so each needs a decision now.

### B1 — `BlockEditor` (breaking: move)

It edits article blocks: its block types are content's `article_block_type` enum, its media
handling assumes content's media panel, and its own aria-label calls it "Article block editor". No
other module uses it.

**Proposal.** Move it into `@sveltebuilder/content` beside `BlockEditorHost`, which is its only
consumer. If a generic structured-text editor is wanted later, design it then.

### B2 — `LocaleEdit`, `LocalTextLinkEdit`, `LocalTextEdit` (breaking: move)

They edit diglossia's data model (`locale`, `local_text_link`, `local_text`) and exist for the base
template's admin screens. `LocaleSwitcher` is the borderline case: it is chrome every scaffold
renders.

**Proposal.** Keep `LocaleSwitcher` in coreui. Move the three editors into the base template's
`$lib`, or a small `@sveltebuilder/local-text-admin` package if more than the scaffold needs them.
Guardrail 10 already says screen-shaped code lives in templates.

### B3 — `BarcodeInput` (decide)

It carries its own `label` and `error` instead of composing with `Field`. Every other form control
inherits those from `Field` (see E2). Scanning is mostly a warehouse concern, but a scan-or-type
input is plausible in commerce too.

**Proposal.** Keep it in coreui only if commerce will use it; otherwise move it to logistic. Either
way, make it a `Field` citizen: drop `label` and `error`, and read them from `useField()`.

### B4 — `StatusBadge` duplicates `Badge` (breaking: remove)

Its entire markup is `<Badge {variant} {size} class={extraClass}>{label}</Badge>`. CLAUDE.md
describes it as pairing status colour with text, but `Badge` already does exactly that.

**Proposal.** Remove `StatusBadge` and use `Badge`. Logistic's own status badges wrap `Badge`
directly.

### B5 — `Alert` and `InlineNotification` overlap (decide)

Both are inline, severity-coloured messages with an icon slot and a live-region role. `Alert` takes
a `title` and children; `InlineNotification` takes `summary`, `detail`, `technicalId`, `actions`
and dismissal, and is the message system's inline surface. They also disagree on vocabulary (C4).

**Proposal.** Keep both only if the distinction is stated: `Alert` for static page content,
`InlineNotification` for a message-system result. Otherwise fold `Alert` into
`InlineNotification`. Either way, unify the severity vocabulary.

---

## C. Naming and conventions

### C1 — Callback names (breaking)

- `Tag` uses `onremove`; every other callback is camelCase (`onDismiss`, `onScan`, …).
- `TableHeader` has `onSort`; `DataTable` has `onSortChange`.
- `MenuCheckboxItem` has `onSelect` but no `onCheckedChange`, although `Checkbox` has one.

**Proposal.** Write the convention down: `on<Event>` in camelCase, and `on<Value>Change` for every
bindable value (see C2). Then rename `onremove` to `onRemove`, and `onSort` to `onSortChange` or a
deliberate equivalent.

### C2 — Bindable values without a change callback (not breaking)

Without a callback, a caller who needs to persist a change has to watch a bound value with
`$effect`. That is exactly why `Checkbox` gained `onCheckedChange` on 2026-10-01.

| Has `$bindable`                                                                                                                           | Change callback                                     |
| ----------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `Checkbox.checked`, `Drawer.open`, `Pagination.page`, `DataTable.page`, `BlockEditor.blocks`, `DateTimePicker.value`                      | yes                                                 |
| `Switch.checked`, `RadioGroup.value`, `Select.value`, `Tabs.value`, `Accordion.value`, `MenuRadioGroup.value`, `MenuCheckboxItem.checked` | **no**                                              |
| `Dialog.open`, `Popover.open`, `Menu.open`, `ConfirmDialog.open`                                                                          | **no** (`ConfirmDialog` has `onConfirm`/`onCancel`) |
| `Input.value`, `Textarea.value`                                                                                                           | native `oninput` passes through                     |

**Proposal.** Add `onCheckedChange`, `onValueChange` and `onOpenChange` wherever they are missing.
Additive, so it can ship as a patch before the bundled release.

### C3 — How text reaches a component (breaking)

- **`label: string`:** `Field`, `RadioItem`, `SelectItem`, `Checkbox`, `Switch`, `StatusBadge`,
  `MetricCard`, `TimelineItem`, `ProgressBar`, `Spinner`, `BarcodeInput`, `LocaleSwitcher`.
- **`title: string`:** `Dialog`, `Drawer`, `ConfirmDialog`, `Alert`, `AccordionItem`.
- **`content: string`:** `Tooltip`.
- **`triggerLabel: string`:** `MenuSub`, whereas `Menu`, `Popover`, `Dialog` and `Drawer` take a
  `trigger` snippet.
- **`children` snippet:** `Button`, `Badge`, `Tag`, `Label`, `MenuItem`, `TabsTrigger`, and others.

Some of this is principled: a `string` is required where the text becomes an accessible name or an
attribute. Some is not: `Tooltip`'s trigger is `children` while every other overlay's is `trigger`,
and `MenuSub` alone takes a string.

**Proposal.** Write the rule down: strings where the value names something, snippets where it is
content. Then align the outliers: `MenuSub` takes a `trigger` snippet, and `Tooltip` takes a
`trigger` snippet with `content` kept as a string.

### C4 — Severity vocabulary (breaking)

- `Badge`, `Tag`, `StatusBadge`: `default | brand | success | warning | danger | info`.
- `Alert`: `info | success | warning | danger`.
- `InlineNotification`, `Banner`, `SBMessageSeverity`: `success | info | warning | **error**`.
- `Button`: `primary | secondary | ghost | danger | link`.

The color tokens are `--danger-*`, so `error` is the odd one out. It is also what `SBMessage`
carries, so app code is written against it.

**Proposal.** Choose one word, `danger` (matching the tokens), or keep `error` for messages
explicitly. Export the variant and size unions as types: they are private today, so callers cannot
type a variable that holds one.

### C5 — Missing `class` prop (not breaking)

`ConfirmDialog`, `Toast`, `ToastRegion`, `MessageAriaLive`, `LocaleSwitcher`, `LocaleEdit`,
`LocalTextLinkEdit`, `LocalTextEdit`.

**Proposal.** Add `class` to every component with a styled root. Additive.

### C6 — Attribute forwarding (decide)

Only `Input`, `Textarea` and `Button` spread the remaining attributes onto their element. Nothing
else accepts `id`, `aria-*` or `data-*`, so a caller cannot, for example, point `aria-describedby`
at a `Checkbox`.

**Proposal.** Decide a policy before 1.0: either forward the rest props to the root (or the
interactive element) everywhere, or keep the surface closed and say so. Opening it later is
additive; closing it later is breaking, so the safe 1.0 default is closed, made explicit.

---

## D. The CSS surface

`docs/coreui-theming.md` tells developers to override coreui by targeting its "plain class names"
and data attributes in unlayered CSS. That makes class names part of the API, and no list says
which ones are.

### D1 — No declared public class list (policy)

**Proposal.** Publish the public surface:

- each component's root class (`.btn`, `.card`, `.dialog`, …);
- its modifier classes (`.btn.primary`, `.badge.sm`);
- the Bits UI data attributes;
- the 11 public tokens, plus a named list of derived tokens that may be read.

Everything else is internal and may change in a minor.

### D2 — Internal names that are another component's root class (breaking)

| Class                 | Root of            | Also used internally by                                                                                           |
| --------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------- |
| `.label`              | `Label`            | `Tag`, `BarcodeInput`, `Field`, `Checkbox`, `RadioItem`, `Switch`, `LocaleSwitcher`, `MetricCard`, `TimelineItem` |
| `.spinner`            | `Spinner`          | `Button`                                                                                                          |
| `.select`             | `Select`           | `LocaleSwitcher`                                                                                                  |
| `.dialog`             | `Dialog`           | `ConfirmDialog` (shared deliberately)                                                                             |
| `.menu`, `.menu-item` | `Menu`, `MenuItem` | `MenuSub`, `MenuCheckboxItem`, `MenuRadioItem` (shared deliberately)                                              |

`components.css` also has unscoped top-level rules for `.label`, `.spinner`, `.input` and `.field`,
so those styles apply wherever the name appears. `Button`'s internal `.label` inherited the form
`Label`'s colour and failed contrast in dark mode, fixed on 2026-10-07 by renaming it. The other
nine uses pass today by luck. Generic internal names are also widespread (`body` in 9 components,
`icon` in 6, `footer` in 4), and they will collide with application CSS too.

**Proposal.** Prefix internal elements with their component (`.tag__label`, `.alert__icon`), the BEM
convention CLAUDE.md already states for application CSS, and keep shared root classes only where
the sharing is deliberate and documented (`.dialog`, `.menu`). Breaking for anyone who targeted an
internal class, which is why D1 comes first.

### D3 — Physical direction properties (not breaking)

`components.css` has 23 physical-direction declarations (`left`, `margin-left`, `padding-left`,
`border-left`, `text-align: left` and their `right` counterparts) against 5 logical ones. The
earlier count of 15 omitted `text-align`. In right-to-left these place checkmarks, sort icons,
dropdown indicators and padding on the wrong side. axe cannot see it.

**Proposal.** Convert to logical properties (`inset-inline-start`, `margin-inline-start`,
`text-align: start`), then confirm with the human RTL pass.

---

## E. Correctness found during the audit

These are bugs, not API decisions. All can ship as patches.

### E1 — Hard-coded element ids

- `Drawer` gives its description `id="drawer-desc"`.
- `LocaleSwitcher` uses `id="locale-switcher-select"`.
- `LocalTextEdit` (`lte-slug`, `lte-locale`, `lte-content`) and `LocalTextLinkEdit` (`ltl-slug`,
  `ltl-scope`) do the same.

Two instances on one page produce duplicate ids, so a label or description can point at the wrong
element (WCAG 1.3.1 and 4.1.2). **Fix:** `$props.id()`, as `BarcodeInput` and `Select` already
do.

### E2 — `Field` integration is partial

`useField()` is consumed by `Input`, `Textarea`, `Checkbox`, `RadioGroup`, `Select` and
`DateTimePicker`. Its doc comment lists `Switch`, which does not consume it, so a `Switch` inside a
`Field` gets no id, and the Field's label points at nothing. `BarcodeInput` duplicates `Field`
instead (B3). **Fix:** have `Switch` consume it, correct the doc comment, and add the integration to
each control's reference docs.

### E3 — `MenuLabel` outside a group

Bits UI's `GroupHeading`, which `MenuLabel` wraps, throws outside a `MenuGroup` or
`MenuRadioGroup`, and the throw empties the whole menu. It is documented on the component since
2026-10-07, but a component that crashes its parent on plausible usage is a 1.0 problem. **Fix:**
render a plain, non-heading label when no group context exists, or fail with a clear development
error instead of a broken menu.

---

## F. Packaging and exports

### F1 — Peer floors (breaking: peer range)

`svelte` is declared `^5.0.0`. `$props.id()` needs Svelte 5.20, and bits-ui 2.19.5, coreui's own
peer, needs `^5.33.0`. The effective floor is 5.33; anyone below it gets a resolution warning from
bits-ui, not from coreui. **Fix:** declare `svelte: ^5.33.0` (or whatever floor the bundled release
settles on), and keep it in step with bits-ui's.

### F2 — `@internationalized/date` (not breaking)

bits-ui declares `@internationalized/date` as a peer. coreui does not, so a consumer's package
manager warns about a dependency the consumer never chose. **Fix:** declare it as a coreui peer,
with the same range, so the requirement is visible where it originates.

### F3 — `useField` without its type (not breaking)

`useField` is exported; `FieldContext`, which it returns, is not. Someone building a custom control
can call it but cannot name the type. **Fix:** export `FieldContext`, or stop exporting `useField`.
Decide with C6: if coreui's surface is closed, custom controls are not a supported use and the hook
should be private.

### F4 — Exported constants (decide)

`AUTO_DISMISS_MS` and `DEFAULT_MESSAGE_LABELS` are public. The second is the English fallback A1
proposes removing. **Proposal:** keep `AUTO_DISMISS_MS` (it documents behaviour) and stop exporting
`DEFAULT_MESSAGE_LABELS`.

---

## G. Documentation and tests (baseline for stages 2 and 4)

### G1 — Documentation

The README is 75 lines (install, styles, a component list, the copy rule). Six of the 65
components' source files carry any doc comment on their props. There is no per-component reference.
The harness catalog lists every component and its variants, which is a starting point.

### G2 — Tests

One test file (`test/select.test.ts`) for 65 components. Rendering and accessibility are covered by
`apps/dev-kitchen`; behaviour is not covered at all (`COREUI-1.0.md`, stage 2).

---

## Decisions needed before the bundled release

1. **The copy policy (A1, A2).** Should every user-facing string prop be required, with no English
   default? Recommended: yes.
2. **The boundary (B1–B3).** Move `BlockEditor` to content and the locale editors to the template?
   Where does `BarcodeInput` live? Recommended: move all three; `BarcodeInput` follows commerce's
   needs.
3. **Duplicates (B4, B5).** Remove `StatusBadge`? Keep `Alert` and `InlineNotification` separate, with
   a stated distinction? Recommended: remove; keep both, stated.
4. **Severity word (C4).** `danger` everywhere, or `error` for messages? Recommended: `danger`, to
   match the tokens.
5. **Attribute forwarding (C6, F3).** An open or a closed component surface? Recommended: closed and
   explicit for 1.0, with `useField` and `FieldContext` public only if custom controls are a
   supported use.
6. **The CSS contract (D1, D2).** Approve a published list of public classes, with internal
   elements renamed to `component__part`.

## The bundled release

Once those are decided, the breaking items ship together as one coreui minor (0.3.0). With the
modules on `workspace:^` peers, Changesets bumps content and logistic a major with it. That is the
one deliberate cascade the interim rule anticipates (`docs/DEFERRED.md`); call it out in the release
notes.

Breaking, in that release: A1, A2 (or B1), B1, B2, B4, C1, C3, C4, D2, F1, and whichever of B3, B5,
C6 and F4 are decided as changes.

Non-breaking, shippable as patches now or alongside: A3, C2, C5, D3, E1, E2, E3, F2, F3.
