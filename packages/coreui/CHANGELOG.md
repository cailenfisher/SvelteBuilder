# @sveltebuilder/coreui

## 0.2.3

### Patch Changes

- [#34](https://github.com/cailenfisher/SvelteBuilder/pull/34) [`2531d4d`](https://github.com/cailenfisher/SvelteBuilder/commit/2531d4d3944843337da02f7691b45b587219559d) Thanks [@cailenfisher](https://github.com/cailenfisher)! - Fix the WCAG 2.2 A and AA failures the first automated audit of every component found. Several of them changed what keyboard and screen-reader users could do at all.

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

- [#34](https://github.com/cailenfisher/SvelteBuilder/pull/34) [`3a8f724`](https://github.com/cailenfisher/SvelteBuilder/commit/3a8f7242e577483502cdf4a7ef91c7a1f787eba0) Thanks [@cailenfisher](https://github.com/cailenfisher)! - Fix the defects a first `svelte-check` over each package found.

  coreui: `Tooltip`'s `delay` prop now takes effect. It was passed to bits-ui as `openDelay`, which bits-ui v2 does not accept, so every tooltip opened after bits-ui's default 700ms. `Button` declares `disabled` for links as well as buttons, and `EditorBlock` declares the `mediaAssetId` that `BlockEditor` already read.

  content: `BlockEditorHost` now works. It mapped blocks with `type` instead of `blockType`, dropped `position`, and listened for an `onChange` that `BlockEditor` never emits, so no edit reached the parent. `ArticleWorkflowPanel` uses coreui's actual `Drawer`, `Tabs`, `Button` and `Checkbox` APIs; its tabs never switched before. `SectionFront` and `AuthorProfileView` pass `ArticleCard` its required `status` and forward `dictionary`, without which entity copy fell back to context and rendered as `[missing: …]`. `NewsletterSignup`'s submit button passes its label as children. `Button` has no `label` prop, so it was rendering an undefined `children` snippet. Finally, `FrontCurationBoard` uses a `Badge` variant that exists.

## 0.2.2

### Patch Changes

- [#32](https://github.com/cailenfisher/SvelteBuilder/pull/32) [`c31704e`](https://github.com/cailenfisher/SvelteBuilder/commit/c31704e944d3e5c6a2138d1db66b8aab67c6b0c4) Thanks [@cailenfisher](https://github.com/cailenfisher)! - Bump diglossia to ^0.2.0. The `diglossia` peer range on content and logistic moves from `^0.1.0` to `^0.2.0`. 0.2.0 only adds to the API (`subscribe()`/`getVersion()` on `DictionaryInstance`, reactive `merge()` on the instance passed to `setDictionary()`, and a `formatText` that no longer throws on malformed MF2), so no consumer code changes.

## 0.2.1

### Patch Changes

- [#27](https://github.com/cailenfisher/SvelteBuilder/pull/27) [`d36230f`](https://github.com/cailenfisher/SvelteBuilder/commit/d36230f9e3a2d7e2d4e69ae91bf671840b4477a7) Thanks [@cailenfisher](https://github.com/cailenfisher)! - `Select`: the closed trigger shows the selected item's label, not its value. Bits UI resolves the
  trigger text from items that are mounted, and the list is portaled and unmounted until it opens, so
  a Select with a preselected value showed `all_rights_reserved` instead of "All rights reserved"
  until the user opened it. Select now renders its children once in a silent registration pass in
  which each `SelectItem` reports its label, and passes the result to Bits UI as `items`. No change
  to the `Select` / `SelectItem` API.

## 0.2.0

### Minor Changes

- [#25](https://github.com/cailenfisher/SvelteBuilder/pull/25) [`ca21505`](https://github.com/cailenfisher/SvelteBuilder/commit/ca215055910fc83c8e509f80af791ca3e68cca5d) Thanks [@cailenfisher](https://github.com/cailenfisher)! - `ConfirmDialog` is now built on Bits UI's `AlertDialog`, and coreui's remaining hardcoded English
  labels become props.

  **ConfirmDialog.** It composed the general `Dialog`, so it rendered as `role="dialog"` and an
  outside click dismissed it — a stray click could stand in for an answer to a destructive
  confirmation. As an `AlertDialog` it is announced as an alert dialog and ignores outside clicks.
  It no longer shows a close button (cancel is the way out), Escape is ignored while `loading`, and
  `onCancel` now also fires on Escape, not only on the cancel button.

  **Labels.** `Dialog` and `Drawer` take `closeLabel`; `Pagination` takes `previousLabel`,
  `nextLabel` and `label`. The message surfaces share a new `MessageLabels` set passed once as
  `createMessageBus({ labels })` and read from context by `Toast`, `ToastRegion`, `Banner` and
  `InlineNotification`. Every label defaults to its previous English text, so existing callers are
  unaffected. `Dialog` also drops the hidden "{title} dialog" description it rendered when no
  `description` was given.

  The base scaffold passes localized labels for all of these, from eight new `message.*` base slugs
  seeded in English and French.

## 0.1.1

### Patch Changes

- [#13](https://github.com/cailenfisher/SvelteBuilder/pull/13) [`82a7349`](https://github.com/cailenfisher/SvelteBuilder/commit/82a7349fc2d0502704adbb2765c4f0565e888314) Thanks [@cailenfisher](https://github.com/cailenfisher)! - The content module gains row level security, a seed, and its route code as five screen bundles.

  **Security fix — read this one.** All 27 of the module's tables shipped with row level security
  disabled. Supabase's bootstrap grants give anon and authenticated full privileges on everything in
  `public`, so anyone holding the publishable key could read and write every one of them, including
  `subscriber`, `comment` and `newsletter_subscription`. It was verified exploitable, not theorised: as
  the anon role, inserting a row into `subscriber` and then deleting every row both succeeded. Any
  project scaffolded with this module before this release should treat its content tables as having been
  publicly writable.

  Published editorial content is now world-readable; editorial workflow, media licensing terms, preview
  tokens and subscriber PII are admin-only; comments are readable once approved and insertable only as
  pending. Two seams needed SECURITY DEFINER functions rather than policies: newsletter signup, because
  a table anon can insert into is a table anon can probe for membership, and preview-by-link, because a
  policy cannot see which token a request presented and so would have to admit every draft with an
  outstanding link.

  **The module also shipped no seed**, which made it inert rather than empty — every public query
  resolves the slug `'published'` through `article_status`, and with no rows there was no such status.
  The seed now provides the workflow statuses, the publish checklist, a publisher identity for the
  feeds, taxonomy, a newsletter, and one sample article, in English and French.

  **Five screen bundles**: article (body, bylines, comments, OG/Twitter meta, NewsArticle JSON-LD),
  section (lead-plus-river listing with paging), feeds (RSS, sitemap, news sitemap), preview (an
  unpublished article behind an expiring link), admin-article (every status, the publish checklist,
  workflow transitions). Every loader queries `event.locals.supabase`, and
  `@sveltebuilder/content/views` exports the screen contracts.

  **Types narrowed.** `ArticleView`'s prop, `ArticleForStructuredData`, `RssFeedArticle`,
  `NewsSitemapArticle` and `validateArticleForPublish` each demanded resolved copy their own code never
  read, while already taking a `DictionaryInstance` and resolving the headline through it. Everything
  resolves through the dictionary now. That is a behaviour fix as well as a cleanup:
  `validateArticleForPublish` was validating whichever locale a query happened to resolve, and now
  treats a missing translation as missing — so publishing a half-translated article is caught.
  `ArticleWithRelations` and `ArticleRenderable` replace the five ad-hoc shapes; any `ArticleWithCopy`
  still satisfies them.

  **Also fixed:** `storageBaseUrl` was referenced by the old article screen and returned by no loader,
  so every media URL was built against `undefined`. `create_local_text_entry` hardcoded `entity_id` to
  null, so no caller could create entity-bound copy such as an article's headline; it takes an optional
  entity id now. coreui's `Checkbox` had no change callback, which a checklist row needs — it gains
  `onCheckedChange`. The article screen mutated the dictionary the root layout puts in context, shared
  across a server request and accumulating on the client; each screen builds its own request-scoped
  instance.

  **Gates.** `pnpm sql:check` asserts that every table in `public` has RLS and that every RLS-enabled
  table has at least one policy — the check that would have caught the finding above, which nothing
  else could: a table with no policies is valid SQL, typechecks nowhere, and behaves correctly in any
  test running as an owner. It also gains a content assertion file written from the attacker's side. The
  screen-bundle suite understands endpoint routes, and `scaffold:check` gains a content-no-screens case.

## 0.1.0

### Minor Changes

- Republish to bring npm in sync with the source: the diglossia extraction (dropped the stale
  `@sveltebuilder/hermes` peer dependency) and the messaging system rewrite (`createMessageBus` /
  `setMessageBus` / `getMessageBus`, replacing the old module-level `messageBus` singleton) landed
  in the repo without a version bump. The last published `0.0.15` still ships the pre-rewrite code,
  which breaks the base scaffold template's root layout (`setMessageBus(createMessageBus())` —
  `createMessageBus` doesn't exist in that build) on first render of every freshly scaffolded
  project.
