---
name: project-messaging-system
description: Universal messaging system added to coreui — SBMessage type, messageBus store, Toast/ToastRegion/Banner/InlineNotification/ConfirmDialog/MessageAriaLive components, wired into dev-kitchen root layout
metadata:
  type: project
---

Universal messaging system built and wired into coreui and dev-kitchen.

**Why:** SvelteBuilder needed a unified, typed message surface for all domain modules to emit user feedback — CRUD success, errors, system warnings, destructive confirmations — following the research in `docs/sveltebuilder-messaging-system.md`.

**Components added to `@sveltebuilder/coreui`:**
- `message-bus.svelte.ts` — module-level `$state` reactive store; `messageBus.sendToast()`, `.dismissToast()`, `.sendBanner()`, `.dismissBanner()`; exports `SBMessage`, `SBMessageSeverity`, `SBMessageAction`, `AUTO_DISMISS_MS`
- `Toast.svelte` — single toast unit; auto-dismiss timer (100 ms ticks); pause-on-hover/focus; undo-action pattern with countdown progress bar; technical detail disclosure; severity icons
- `ToastRegion.svelte` — fixed-position container; max 3 visible toasts + "+N more" queue indicator
- `InlineNotification.svelte` — persistent contextual notification; dismissible; actions; technical detail disclosure; `role="alert"` for error/warning, `role="status"` for info/success
- `Banner.svelte` — app-shell-level notification; bus-driven (default) or prop-driven (controlled); slides in below nav
- `ConfirmDialog.svelte` — composes `Dialog.svelte`; danger confirm + cancel buttons; loading state
- `MessageAriaLive.svelte` — two static `aria-live` regions (polite + assertive) for WCAG 4.1.3; subscribes to bus and injects summaries on new messages

**Wired in dev-kitchen root layout:**
`<MessageAriaLive />` before content, `<Banner />` between nav and main, `<ToastRegion />` after the app div.

**How to apply:** All domain modules should import `messageBus` from `@sveltebuilder/coreui` to emit messages. Errors go to `InlineNotification` (inline). CRUD success goes to `messageBus.sendToast()`. Destructive hard-deletes use `ConfirmDialog`. System-level messages use `messageBus.sendBanner()`.

**SSR note:** `messageBus` uses module-level `$state`. Safe for CSR (dev-kitchen is CSR). For SSR scaffold apps, gate behind `if (browser)` or use per-request state.

**Open:** `SBNotificationCenter` (session history panel with bell icon) deferred — not in v1 scope.
