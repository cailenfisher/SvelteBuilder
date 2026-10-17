// ============================================================
// Message — unified message type and reactive message bus
//
// Consumers call messageBus.sendToast() / sendBanner() to emit.
// ToastRegion, Banner, and MessageLiveRegion read from context via
// getMessageBus(). A module-level singleton would share state across
// concurrent server requests, so the bus is a per-request instance
// created with createMessageBus() and put in context with
// setMessageBus() — the same shape as diglossia's dictionary.
// ============================================================

import { getContext, setContext } from 'svelte';

export type MessageSeverity = 'success' | 'info' | 'warning' | 'danger' | 'critical';

export type MessageAction = {
  label: string;
  onAction: () => void;
};

export type Message = {
  id: string;
  severity: MessageSeverity;
  summary: string;
  detail?: string;
  technicalId?: string;
  actions?: MessageAction[];
  source?: string;
  undoAction?: () => void;
  undoDurationMs?: number;
};

// Default auto-dismiss durations in ms. null = never auto-dismiss.
export const AUTO_DISMISS_MS: Record<MessageSeverity, number | null> = {
  success: 5000,
  info: 7000,
  warning: null,
  danger: null,
  critical: null,
};

/**
 * Copy the message surfaces render around a message — the message text itself
 * arrives on Message. Interpolated entries are functions so a locale controls
 * where the value sits. Every entry is required: there is no English fallback, so
 * a caller cannot ship English accessible names to readers of another locale.
 */
export type MessageLabels = {
  undo: string;
  showDetails: string;
  hideDetails: string;
  reference: (technicalId: string) => string;
  dismiss: (summary: string) => string;
  secondsRemaining: (seconds: number) => string;
  region: string;
  queued: (count: number) => string;
};

export type MessageBusOptions = {
  labels: MessageLabels;
};

export type MessageBus = {
  readonly labels: MessageLabels;
  readonly toasts: Message[];
  readonly banner: Message | null;
  sendToast(message: Omit<Message, 'id'>): string;
  dismissToast(id: string): void;
  sendBanner(message: Omit<Message, 'id'>): string;
  dismissBanner(): void;
};

function generateId(): string {
  return Math.random().toString(36).slice(2, 9);
}

/** Creates a fresh, request-scoped message bus. Call once per render, in the root layout's `<script>` body. */
export function createMessageBus(options: MessageBusOptions): MessageBus {
  const { labels } = options;
  const state = $state<{ toasts: Message[]; banner: Message | null }>({
    toasts: [],
    banner: null,
  });

  return {
    labels,

    get toasts() {
      return state.toasts;
    },

    get banner() {
      return state.banner;
    },

    sendToast(message: Omit<Message, 'id'>): string {
      const id = generateId();
      state.toasts = [...state.toasts, { ...message, id }];
      return id;
    },

    dismissToast(id: string): void {
      state.toasts = state.toasts.filter((m) => m.id !== id);
    },

    sendBanner(message: Omit<Message, 'id'>): string {
      const id = generateId();
      state.banner = { ...message, id };
      return id;
    },

    dismissBanner(): void {
      state.banner = null;
    },
  };
}

const CONTEXT_KEY = Symbol('sveltebuilder-message-bus');

/** Puts a message bus in context. Call once, in the root layout's `<script>` body. */
export function setMessageBus(bus: MessageBus): void {
  setContext(CONTEXT_KEY, bus);
}

/** Reads the message bus from context. Throws a clear, actionable error if none was set. */
export function getMessageBus(): MessageBus {
  const bus = getContext<MessageBus | undefined>(CONTEXT_KEY);
  if (!bus) {
    throw new Error(
      '[coreui] No message bus found in context. Call ' +
        'setMessageBus(createMessageBus()) once in your root layout before any ' +
        'component calls getMessageBus().'
    );
  }
  return bus;
}

/**
 * The context bus's labels, for components such as InlineNotification that render a message
 * without sending one. Throws the same error as getMessageBus() when no bus is set: there is no
 * English fallback to use instead.
 */
export function getMessageLabels(): MessageLabels {
  return getMessageBus().labels;
}
