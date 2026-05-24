// ============================================================
// SBMessage — unified message type and reactive bus
//
// Consumers call messageBus.sendToast() / sendBanner() to emit.
// ToastRegion, Banner, and MessageAriaLive subscribe to the bus.
//
// SSR note: module-level $state is shared per-request on the server.
// This bus is designed for client-side use; mount components inside
// a browser-only layout or guard with `if (browser)` when needed.
// ============================================================

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

type BusState = {
  toasts: SBMessage[];
  banner: SBMessage | null;
};

const busState = $state<BusState>({ toasts: [], banner: null });

function generateId(): string {
  return Math.random().toString(36).slice(2, 9);
}

export const messageBus = {
  get toasts() {
    return busState.toasts;
  },

  get banner() {
    return busState.banner;
  },

  sendToast(msg: Omit<SBMessage, 'id'>): string {
    const id = generateId();
    busState.toasts = [...busState.toasts, { ...msg, id }];
    return id;
  },

  dismissToast(id: string): void {
    busState.toasts = busState.toasts.filter((m) => m.id !== id);
  },

  sendBanner(msg: Omit<SBMessage, 'id'>): string {
    const id = generateId();
    busState.banner = { ...msg, id };
    return id;
  },

  dismissBanner(): void {
    busState.banner = null;
  },
};
