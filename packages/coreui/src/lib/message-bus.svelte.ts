// ============================================================
// SBMessage — unified message type and reactive message bus
//
// Consumers call messageBus.sendToast() / sendBanner() to emit.
// ToastRegion, Banner, and MessageAriaLive read from context via
// getMessageBus(). A module-level singleton would share state across
// concurrent server requests, so the bus is a per-request instance
// created with createMessageBus() and put in context with
// setMessageBus() — the same shape as diglossia's dictionary.
// ============================================================

import { getContext, setContext } from 'svelte';

export type SBMessageSeverity = 'success' | 'info' | 'warning' | 'error' | 'critical';

export type SBMessageAction = {
  label: string;
  onAction: () => void;
};

export type SBMessage = {
  id: string;
  severity: SBMessageSeverity;
  summary: string;
  detail?: string;
  technicalId?: string;
  actions?: SBMessageAction[];
  source?: string;
  undoAction?: () => void;
  undoDurationMs?: number;
};

// Default auto-dismiss durations in ms. null = never auto-dismiss.
export const AUTO_DISMISS_MS: Record<SBMessageSeverity, number | null> = {
  success: 5000,
  info: 7000,
  warning: null,
  error: null,
  critical: null,
};

export interface MessageBus {
  readonly toasts: SBMessage[];
  readonly banner: SBMessage | null;
  sendToast(msg: Omit<SBMessage, 'id'>): string;
  dismissToast(id: string): void;
  sendBanner(msg: Omit<SBMessage, 'id'>): string;
  dismissBanner(): void;
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 9);
}

/** Creates a fresh, request-scoped message bus. Call once per render, in the root layout's `<script>` body. */
export function createMessageBus(): MessageBus {
  const state = $state<{ toasts: SBMessage[]; banner: SBMessage | null }>({
    toasts: [],
    banner: null,
  });

  return {
    get toasts() {
      return state.toasts;
    },

    get banner() {
      return state.banner;
    },

    sendToast(msg: Omit<SBMessage, 'id'>): string {
      const id = generateId();
      state.toasts = [...state.toasts, { ...msg, id }];
      return id;
    },

    dismissToast(id: string): void {
      state.toasts = state.toasts.filter((m) => m.id !== id);
    },

    sendBanner(msg: Omit<SBMessage, 'id'>): string {
      const id = generateId();
      state.banner = { ...msg, id };
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
