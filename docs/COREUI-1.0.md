# COREUI-1.0.md — what has to be true before `@sveltebuilder/coreui` is called 1.0

`@sveltebuilder/coreui` is at 0.2.x. This document records what has to be done before 1.0 is a fair
claim, and the order to do it in. The detailed findings for stage 1 are in
[`COREUI-API-AUDIT.md`](./COREUI-API-AUDIT.md).

Read this before proposing a coreui version above 0.x, or a breaking change to coreui.

---

## Why 1.0, and why not yet

**1.0 is a promise:** no breaking change without a major version. It has to be earned by an API that
has stopped moving and by quality that has been demonstrated, not assumed. The final gate is
vigorous beta use and hands-on human testing. No automated check stands in for it.

**There is also a practical reason to aim for it.** `@sveltebuilder/content` and
`@sveltebuilder/logistic` declare coreui as a `workspace:^` peer. On a 0.x version a caret range
excludes the next minor, so every coreui minor forces Changesets to bump both modules a major. That
took both to 1.0.0 on 2026-10-05 with no change of their own. Until coreui is 1.0, coreui changesets
are written as `patch` wherever that is defensible (`docs/DEFERRED.md`). That rule works, but it
blurs the meaning of coreui's own version numbers. Reaching 1.0 lets caret ranges cover coreui
minors and ends the cascade.

The cascade is a reason to plan for 1.0, not a reason to rush it. If 1.0 is far off, widening the
modules' peer range (for example `>=0.2.0 <1.0.0`) is the interim alternative.

---

## Where coreui stands (2026-10-08)

Already in place:

- 65 components, all visual styles in `styles/components.css` under `@layer components`, Bits UI
  data-attribute wiring throughout.
- Every component is rendered from source in `apps/dev-kitchen`, server-rendered and hydrated, with
  typed fixtures. An exported component with no showcase page fails `pnpm check`.
- The automated half of a WCAG 2.2 AA audit runs on every pull request: axe-core in light, dark and
  right-to-left, overlays opened from the keyboard, and a focus-visibility walk. Its first run found,
  and the 2026-10-07 work fixed:
  - keyboard-unreachable overlay triggers;
  - an unlabeled `Select`;
  - 862 contrast failures.
- Derived color tokens hold AA contrast for any base color (`docs/coreui-theming.md`).
- `svelte-check` runs over the package in CI.

Not yet in place: the five areas below.

---

## 1. Settle the API

Everything here would be a breaking change after 1.0, so it is decided first and shipped together.
`COREUI-API-AUDIT.md` lists each item with the files involved and a proposed resolution.

- **English defaults in an i18n-first library.** About ten props default to English strings
  (accessible names, placeholders, empty states). A caller who omits one ships English to every
  locale, and nothing warns them. The proposal is to make them required, so the type checker forces
  every caller to supply copy.
- **Hard-coded English with no prop at all**, chiefly in `BlockEditor`.
- **coreui's boundary.** `BlockEditor` (article block types), the locale-admin editors (diglossia's
  data model) and `BarcodeInput` (warehouse scanning) are domain-shaped. Moving any of them to a
  module after 1.0 is breaking, so it is decided now.
- **Naming consistency:** callback props (`onremove` among camelCase names), text-carrying props
  (`label` versus `children`), snippet names, size and variant vocabularies.
- **The CSS surface is API.** Developers override coreui with unlayered CSS targeting its class names
  and data attributes, so those names are a contract. Internal elements currently use generic names
  (`.label`, `.icon`, `.close`, `.body`) that collide with each other and with application CSS. That
  collision is what broke `Button`'s contrast. Decide which classes are public, namespace the rest,
  and document which derived tokens may be read.
- **Honest peer ranges.** Declare the real Svelte floor. For example, `$props.id()` needs a newer
  Svelte than the declared `^5.0.0`.
- **Public contracts that are currently implicit:** the `Field` context (`useField()`), the message
  bus, and the exported constants and types.

**Ship it as one breaking release.** Bundle the accepted changes into a single coreui minor. Because
of the cascade, content and logistic take one deliberate major with it, so do it once, not across a
series of releases.

## 2. Prove behaviour, not just rendering

The harness proves each component renders, hydrates and passes axe. It asserts nothing about what
the component does.

- **Behaviour tests for every interactive component:**
  - keyboard interaction;
  - controlled versus bound usage;
  - callbacks firing exactly once;
  - focus moving in and returning;
  - disabled and read-only states;
  - `DataTable` sorting and paging;
  - message-bus queueing and dismissal.

  coreui has one test file today. Vitest's server rendering covers markup; interaction needs a
  browser layer (Playwright against the harness, or a component-testing setup).

- **Cross-browser.** The audit runs Chromium only. Add WebKit and Firefox. The color tokens rely on
  CSS relative color syntax, so publish a browser support policy that says which versions are
  supported.

## 3. The human half of the WCAG 2.2 AA audit

This is the part automation cannot do, and it is the natural shape of the final human gate:

- Screen readers: VoiceOver on macOS and iOS, NVDA on Windows, TalkBack on Android. Prioritise
  overlays, `Select`, `DateTimePicker`, `DataTable`, `BlockEditor`, and the toast and live-region
  announcements.
- Zoom to 400% and reflow at 320 CSS pixels (WCAG 1.4.10).
- Right-to-left mirroring. `components.css` still uses physical `left`/`right` declarations in
  places where logical properties belong.
- Windows forced-colors (high contrast) mode, which nothing checks today.
- `prefers-reduced-motion`, and pointer target sizes on touch devices.

Record findings against components, fix them, and keep the automated suite green throughout.

## 4. Documentation and policy

- **A reference page for every component:** props, snippets, callbacks, bindable values, the Field
  integration, and accessibility notes (what the component guarantees, what the caller must supply).
  The harness catalog already lists every component and its variants, so it can seed this.
  `apps/docs` is a placeholder today.
- **A written compatibility policy:** what counts as breaking (props, class names, data attributes,
  tokens, DOM structure, peer ranges), how deprecations are announced, and how long they last.
- **Browser and framework support:** the Svelte and Bits UI floors, and the browser matrix from
  stage 2.

## 5. Beta and release candidate

- Publish a `1.0.0-rc` once stages 1–4 are done.
- Use it in real applications. The newspaper POC is the obvious first; scaffolded apps from
  `npm create sveltebuilder` are the second.
- Exit when a period of real use has produced no breaking change and the hands-on human pass is
  complete. The length of that period is a judgement call, not a date.

---

## Suggested order

| Stage | Work                                      | Breaking?  | Gate to move on                                                |
| ----- | ----------------------------------------- | ---------- | -------------------------------------------------------------- |
| 1     | API audit, decisions, one bundled release | Yes, once  | Every audit item resolved: changed, or explicitly kept         |
| 2     | Behaviour tests, more browsers            | No         | Interactive components covered; audit green in three engines   |
| 4     | Reference docs, compatibility policy      | No         | Every export documented; policy published                      |
| 5     | `1.0.0-rc`, beta use                      | No         | A period of real use with no breaking change                   |
| 3     | Human accessibility pass (during 5)       | Fixes only | Screen readers, zoom, RTL and forced colors reviewed and fixed |
| —     | `1.0.0`                                   | —          | Maintainer sign-off after hands-on testing                     |

Stage 3 is listed out of numeric order on purpose. It runs during the release candidate, once the
API has stopped moving, so the human review is of what will actually ship. Stage 2 can overlap with
stage 1's implementation.

When 1.0 ships, the interim "coreui changesets as patch" rule in `docs/DEFERRED.md` retires, and
content and logistic can declare a caret peer on `^1.0.0` that covers every 1.x.
