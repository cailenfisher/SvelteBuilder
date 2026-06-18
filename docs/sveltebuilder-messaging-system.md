# SvelteBuilder: Universal Messaging System — Research & Recommendations

---

## Research Summary

### 1. Notification Taxonomy (What types exist and what they're for)

The industry has largely converged on a layered vocabulary, best codified by IBM's Carbon Design System. Carbon supports inline, toast, actionable, and modal notification variants, with some product teams also adding banners and notification centers. The key distinctions:

- **Toast** — auto-dismissing status messages used to convey information without disrupting user workflows. Best for low-stakes confirmations of completed actions. Carbon recommends toast notifications automatically disappear after five seconds.
- **Snackbar** — similar to toasts but often include actions like "Undo." The distinction matters: toasts inform, snackbars invite a response.
- **Inline notification** — appears in context, adjacent to the UI element that triggered it. Inline notifications have an optional ghost button action adjacent to the title and body content. Persistent until dismissed. The correct home for form-level and field-level errors.
- **Banner** — takes over the top of an interface to show general notifications for the product or system, not a specific task. They persist until dismissed by the user and may persist across multiple sessions.
- **Modal / dialog** — reserved for destructive or irreversible operations requiring explicit confirmation. Blocks all interaction.

### 2. The Critical Rule: Don't Use Toasts for Errors

This is where most implementations go wrong. One of the common pitfalls in applications is to use toast messages for showing errors. The reasons are practical: toasts auto-dismiss, errors require time to read and act on, and users with screen readers or cognitive disabilities are especially disadvantaged. Error handling UX requires special thought in enterprise software. The technical source of the problem can be complex — related to things like data, permissions, race conditions, or processing — and the solution may be difficult to explain.

The correct pattern: surface errors inline (near the offending field or action), use persistent notifications for anything requiring a user decision.

### 3. CRUD Feedback Expectations

When a system creates an object successfully and redirects the user to the entity list view, displaying feedback via notification/toast is appropriate. When the system cannot create the object due to an error, providing a clear and concise message explaining the exact reason for the error — for example, "Error: No sufficient permissions" — helps the user understand what went wrong and potentially resolve the issue.

The key principle for CRUD: success is transient and can be a toast; failure is persistent and must be inline or modal depending on severity.

### 4. The Undo Pattern

Gmail popularized a pattern that is now a UX standard: snackbars include actions like "Undo," enabling soft deletes and reversible operations. This sidesteps confirmation dialogs entirely for common destructive actions — the user is informed *after* the action and given a grace window to reverse it. This is measurably preferred by users over "Are you sure?" dialogs for low-to-medium stakes operations.

### 5. Notification Fatigue

In many products, setting notification channels on mute is a default rather than an exception. The reason is high frequency, which creates disruptions and eventually notification fatigue — any popping messages get dismissed instantly. IBM Research found this condition makes users desensitized, causing them to ignore or miss important alerts. The remedy is strict prioritization: surface fewer, higher-quality signals.

The anti-pattern is the notification feed that just keeps growing, treating all notifications as equally important and forcing users to mentally filter what they've already seen.

### 6. Accessibility: ARIA Live Regions

This is non-negotiable and frequently botched. A good practice is to have only two live regions on the page: one assertive region and one polite region, inserted into the page on page load. Updates are then inserted into these two regions and the message queue is managed via JavaScript. If you have multiple live regions on a page, they may interfere with each other and some messages might not be announced at all.

The `aria-live` values map directly to urgency:

- `aria-live="polite"` indicates the screen reader should wait until the user is idle before presenting updates — the most commonly used value, as interrupting the user with "assertive" might interrupt their flow.
- `aria-live="assertive"` should only be used for time-sensitive/critical notifications that absolutely require the user's immediate attention. Generally, a change to an assertive live region will interrupt any announcement a screen reader is currently making.

WCAG 2.1 SC 4.1.3 (Status Messages) requires that status messages be programmatically determinable through role or property — meaning every visible notification must have a corresponding announcement path for assistive technology.

The live region must be empty on page load or when first added to the DOM. If adding the live region dynamically, it is best practice to wait at least 2 seconds for the accessibility API to identify it before injecting any text.

### 7. Error Message Content Standards

One UX researcher described two users sitting next to each other, both receiving errors simultaneously. The third-party product displayed a giant red X with "ERROR" in all caps and a pile of script beneath it — the user gasped, closed the browser, and shot back in his chair. The user receiving the error in the other product read a message like "Something weird just happened on our end, sorry about that. Please refresh your screen and try that again." The error code was listed in small text below, with an expand option for folks who wanted to view details.

This anecdote perfectly encapsulates the right model: human-readable copy up front, technical detail collapsed behind a disclosure. And critically: never expose stack traces in API responses — it's not only ugly but dangerous from a security standpoint, as an attacker might infer libraries and versions being used.

### References

- IBM Carbon Design System — Notification Pattern: https://v10.carbondesignsystem.com/patterns/notification-pattern/
- Sara Soueidan — Accessible Notifications with ARIA Live Regions (Parts 1 & 2): https://www.sarasoueidan.com/blog/accessible-notifications-with-aria-live-regions-part-1/
- MDN — ARIA Live Regions: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions
- LogRocket — Toast Notifications UX: https://blog.logrocket.com/ux-design/toast-notifications/
- CXL — Error Messages: https://cxl.com/blog/error-messages/
- Pencil & Paper — Error Feedback UX in Enterprise: https://www.pencilandpaper.io/articles/ux-pattern-analysis-error-feedback
- Smashing Magazine — Design Guidelines for Better Notifications UX: https://www.smashingmagazine.com/2025/07/design-guidelines-better-notifications-ux/
- NN/g — Alert Fatigue in User Interfaces: https://www.nngroup.com/videos/alert-fatigue-user-interfaces/
- WCAG 2.1 — SC 4.1.3 Status Messages: https://www.w3.org/WAI/WCAG21/Understanding/status-messages.html

---

## Recommendations for SvelteBuilder

The research points toward one clear conclusion: **a unified messaging system needs multiple distinct output channels, all fed from a single typed source of truth.** Here's how I'd structure it for SvelteBuilder.

---

### The Message Taxonomy

Define a single `SBMessage` type with a `severity` discriminant:

| Severity | Intent | Auto-dismiss? | Blocks interaction? |
|---|---|---|---|
| `success` | Confirms a completed action | Yes (5s) | No |
| `info` | Neutral update or status | Yes (7s) | No |
| `warning` | Caution, non-blocking | No | No |
| `error` | Something failed, user must act | No | Depends on scope |
| `critical` | Data loss risk or destructive confirmation | No | Yes (modal) |

---

### The Output Channels

Four distinct visual surfaces. Each serves a different context and audience:

**1. Toast / Snackbar (transient, floating)**

The go-to for `success` and `info` after CRUD operations. Appears in a fixed region — bottom-center on mobile, bottom-right or top-right on desktop. Supports one optional action button (the canonical use is **Undo**). Never used for `error`.

Key decisions for SvelteBuilder:

- Stack a maximum of **3** toasts; additional messages queue and appear as the prior ones dismiss
- Hovering or focusing a toast pauses its auto-dismiss timer (critical for motor and cognitive accessibility)
- Each toast is individually dismissible via keyboard (`Escape` or explicit close button)

**2. Inline Notification (persistent, contextual)**

For `warning` and `error` states tied to a specific component — a form, a table row, a card. Renders inside the component's layout. Does not float. Does not auto-dismiss. This is the correct surface for form validation failures and entity-level data errors.

The inline notification becomes the standard contract for all domain-module components: when a `ProductCard` or a logistics `ShipmentItem` encounters a data problem, it renders an inline notification within its own boundaries. This keeps errors localized and avoids the system-wide toast channel being polluted with entity-level noise.

**3. Page Banner (persistent, scoped to app shell)**

For system-wide or session-wide messages: maintenance windows, account warnings, permission degradation, connectivity loss. Renders beneath the main navigation bar. Persists across route transitions until explicitly dismissed or resolved. One banner maximum at a time; if multiple system messages exist, they queue in a notification center (see below).

**4. Confirmation Modal (blocking)**

For `critical` severity only — irreversible destructive actions (permanent delete, bulk operations with no undo path, legal confirmations). This is explicitly **not** an everyday CRUD pattern; it's a last resort for when the undo-toast pattern genuinely cannot provide adequate safety.

---

### The Undo Pattern as Default for Destructive Actions

For the vast majority of delete and archive operations across all domain modules, make the **undo toast the default**, not the confirmation dialog. The flow:

1. User clicks "Delete"
2. Action executes immediately (soft delete in DB, or queued with a short delay server-side)
3. Toast appears: *"Order #4821 deleted"* + **[Undo]** button + 7-second countdown visible as a thin progress bar beneath the toast
4. If no undo: committed. If undo clicked: reversal executes, toast updates to *"Order #4821 restored"*

This is faster, less friction, and empirically more trusted by users than "Are you sure?" dialogs. Reserve modals for hard deletes with no soft-delete path, or bulk operations above a configurable threshold (e.g., "Delete 47 records").

---

### Error Message Structure

Every `SBMessage` of severity `warning` or `error` should carry:

- **`summary`** — one sentence, plain language, no jargon. What happened. ("The shipment could not be saved.")
- **`detail`** *(optional)* — one to two sentences of helpful guidance. What to do next. ("Check that the destination address is complete and try again.")
- **`technicalId`** *(optional)* — an opaque correlation ID, never a stack trace. Shown collapsed behind a "Show details" disclosure, aimed at users who will contact support. Helps your support team look up the actual error log server-side without exposing anything sensitive.
- **`actions`** *(optional array)* — labeled CTA buttons. "Retry", "Contact support", "Review address" — whatever is contextually actionable.
- **`source`** *(optional)* — the module or layer that emitted the message (`hermes`, `sveltebuilder-commerce`, `api`, `network`). Used internally for filtering and display in a notification center, not necessarily shown to users.

This structure is i18n-aware by design: `summary` and `detail` should be `LocalText` values when the message originates from a domain module. Messages from the application shell (auth failures, network, etc.) are supplied as plain strings by the consuming app, consistent with the existing hermes boundary.

---

### The Notification Center

For enterprise deployments — especially the logistics and commerce modules, where background operations run and need to report back — a **notification center** (a slide-out panel or popover) is the right complement to transient toasts. It serves as the persistent record of everything that happened:

- Stores all messages emitted during the session (with configurable history depth)
- Groups by source module
- Supports mark-as-read, dismiss, and bulk clear
- Surfaced via a bell icon in the app shell with an unread badge count
- Does **not** auto-clear — it's the user's log, not the system's

This addresses notification fatigue elegantly: the toast channel stays sparse and high-signal because everything is also archived in the center. Power users who want full transparency have it; casual users aren't overwhelmed.

---

### Accessibility Implementation Notes

Given that svelte-hermes is already in the foundation and you own the app shell in the scaffold:

- Mount **two static ARIA live regions** on app boot in the root layout: one `aria-live="polite"` (for `success`/`info`/`warning`) and one `aria-live="assertive"` (for `error`/`critical`). Never create them dynamically.
- All toast and banner visuals are backed by injecting into these two regions — the visual and audible channels are decoupled but synchronized.
- Toast close buttons need `aria-label` (e.g., "Dismiss: Order saved") not just "×"
- Color alone is never the sole error indicator — always pair color with icon + text
- Countdown timers (undo grace period) should be communicated to screen readers as a periodically updated `aria-label` on the progress element, not as live region updates (which would be too chatty)
- `prefers-reduced-motion`: toast slide animations should collapse to a simple fade when this media query is set

---

### Component Surface for coreui

The components to add to `sveltebuilder-coreui` to support this system:

| Component | Role |
|---|---|
| `<SBToast>` | Single toast unit; receives an `SBMessage`, handles timer, pause-on-hover, dismiss |
| `<SBToastRegion>` | Fixed-position container managing the stack and queue; owns the polite ARIA live region |
| `<SBInlineNotification>` | Persistent contextual notification for use inside domain components and forms |
| `<SBBanner>` | App-shell-level persistent notification |
| `<SBNotificationCenter>` | Slide-out panel with session history |
| `<SBConfirmDialog>` | Modal wrapper for `critical` confirmations, with built-in focus trap and `Escape` dismiss |

All of these are i18n-agnostic at the component level (they accept resolved strings), consistent with the established pattern. The domain modules that emit messages are responsible for resolving their copy through hermes before dispatching to the message bus.
