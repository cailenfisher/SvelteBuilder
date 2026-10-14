---
'@sveltebuilder/coreui': major
'@sveltebuilder/content': major
'@sveltebuilder/logistic': major
'create-sveltebuilder': minor
---

coreui's API and CSS settle for 1.0. Every rename is listed in `docs/MIGRATION-2.0.md` (completed for
the release candidate); the public CSS surface is in `docs/COREUI-COMPATIBILITY.md`.

- **No English defaults.** Accessible-name strings are required: `Dialog`/`Drawer` `closeLabel`,
  `ConfirmDialog` `confirmLabel`/`cancelLabel`, `Pagination` labels, `Spinner` and `ProgressBar`
  `label`, and `removeLabel` whenever a `Tag` has `onRemove`. `DataTable` replaces `emptyLabel` with
  one required `labels` object (`empty`, `pagination`, `previousPage`, `nextPage`). `Select`'s
  `placeholder` is optional with no default. `createMessageBus()` requires a complete `labels`
  object, `DEFAULT_MESSAGE_LABELS` is gone, and `InlineNotification` without a message bus in
  context now throws instead of falling back to English.
- **Renamed:** `RadioItem` → `RadioGroupItem`, `TableHeader` → `TableHeaderCell`, `LocaleSwitcher` →
  `LocalePicker`, `MessageAriaLive` → `MessageLiveRegion`, and the `SBMessage`, `SBMessageAction`,
  `SBMessageSeverity` types → `Message`, `MessageAction`, `MessageSeverity`.
- **One severity word:** the message severity `error` is now `danger`, matching `Badge`, `Alert` and
  the colour tokens.
- **Callbacks and text:** `Tag`'s `onremove` is `onRemove`. `MenuSub` takes a `trigger` snippet
  instead of `triggerLabel`, and `Tooltip` a `trigger` snippet instead of `children`.
  `DataTableColumn.align` is `'start' | 'end'`.
- **Types:** every variant, size, side and orientation union is exported (`ButtonVariant`,
  `BadgeSize`, `DrawerSide`, …), as are `DataTableLabels` and the screen-contract types
  `ScreenCopy`, `ScreenLocale`, `ScreenPage` and `ScreenFormResult`, which content and logistic now
  import instead of declaring their own.
- **CSS is BEM.** Roots match component names (`.btn` → `.button`, `.progress` → `.progress-bar`,
  `.notification` → `.inline-notification`), parts are `__part` (`.card .body` → `.card__body`) and
  modifiers `--modifier` (`.btn.primary` → `.button--primary`). Generic internal classes no longer
  collide: a `Tag`'s text, a `MetricCard` or `TimelineItem` label, a `Select` inside an errored `Field`,
  a `MenuCheckboxItem` and a `Timeline` inside a `Card` had each been picking up another component's
  rules. `Table`'s `class` now lands on its scrolling root.
- **Peers:** `svelte` `^5.33.0`; `diglossia` is an optional peer, for the screen-contract types.
- content's `ArticleList`, `AssignmentQueue`, `SubscriberList` and `ArticleWorkflowPanel` resolve
  their own column, table and panel copy from the dictionary (scope `content`), seeded in English and
  French, and take an optional `dictionary` prop.
