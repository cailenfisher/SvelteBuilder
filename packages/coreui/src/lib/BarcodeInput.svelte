<script lang="ts">
  // Optimized for barcode scanner input. Scanners emit characters very quickly
  // (< 50ms between keystrokes) then send Enter. Regular keyboard input is slower.
  // We detect scanner input by inter-keystroke speed and flush immediately on Enter.

  type Props = {
    onScan: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    label?: string;
    error?: string;
    class?: string | undefined;
  };

  let {
    onScan,
    placeholder = 'Scan or type...',
    disabled = false,
    label,
    error,
    class: extraClass,
  }: Props = $props();

  const SCAN_THRESHOLD_MS = 50;
  const MANUAL_DEBOUNCE_MS = 300;

  let inputValue = $state('');
  let lastKeyTime = $state(0);
  let flushTimeout: ReturnType<typeof setTimeout> | null = null;

  function flush() {
    const trimmed = inputValue.trim();
    if (trimmed) {
      onScan(trimmed);
      inputValue = '';
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (flushTimeout) clearTimeout(flushTimeout);
      flush();
    }
  }

  function handleInput() {
    const now = Date.now();
    const elapsed = now - lastKeyTime;
    lastKeyTime = now;

    if (flushTimeout) clearTimeout(flushTimeout);

    const delay = elapsed < SCAN_THRESHOLD_MS ? 50 : MANUAL_DEBOUNCE_MS;
    flushTimeout = setTimeout(flush, delay);
  }

  const inputId = $derived(label ? `barcode-input-${Math.random().toString(36).slice(2)}` : undefined);

  const classes = $derived(
    ['barcode-input', error ? 'barcode-input--error' : '', extraClass ?? '']
      .filter(Boolean)
      .join(' ')
  );
</script>

<div class={classes}>
  {#if label}
    <label class="barcode-input__label" for={inputId}>{label}</label>
  {/if}

  <div class="barcode-input__wrapper">
    <span class="barcode-input__icon" aria-hidden="true">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <rect x="1" y="3" width="1.5" height="10" fill="currentColor"/>
        <rect x="4" y="3" width="1" height="10" fill="currentColor"/>
        <rect x="6.5" y="3" width="2" height="10" fill="currentColor"/>
        <rect x="10" y="3" width="1" height="10" fill="currentColor"/>
        <rect x="12.5" y="3" width="1.5" height="10" fill="currentColor"/>
      </svg>
    </span>
    <input
      id={inputId}
      type="text"
      class="barcode-input__field"
      bind:value={inputValue}
      {placeholder}
      {disabled}
      autocomplete="off"
      autocorrect="off"
      autocapitalize="off"
      spellcheck={false}
      aria-invalid={error ? 'true' : undefined}
      aria-describedby={error && inputId ? `${inputId}-error` : undefined}
      onkeydown={handleKeydown}
      oninput={handleInput}
    />
  </div>

  {#if error}
    <p id={inputId ? `${inputId}-error` : undefined} class="barcode-input__error" role="alert">
      {error}
    </p>
  {/if}
</div>

<style>
  .barcode-input {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .barcode-input__label {
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--color-text-primary);
  }

  .barcode-input__wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .barcode-input__icon {
    position: absolute;
    inset-inline-start: var(--space-3);
    color: var(--color-text-secondary);
    pointer-events: none;
    display: flex;
    align-items: center;
  }

  .barcode-input__field {
    width: 100%;
    height: var(--input-height-md);
    padding-inline: calc(var(--space-3) + 16px + var(--space-2)) var(--space-3);
    background-color: var(--input-bg);
    border: 1px solid var(--input-border);
    border-radius: var(--input-radius);
    color: var(--color-text-primary);
    font-size: var(--text-base);
    font-family: var(--font-mono, monospace);
    outline: none;
    transition: border-color var(--duration-fast) var(--ease-out),
                box-shadow var(--duration-fast) var(--ease-out);
  }

  .barcode-input__field:focus {
    border-color: var(--input-border-focus);
    box-shadow: 0 0 0 3px var(--color-focus-ring);
  }

  .barcode-input__field:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .barcode-input--error .barcode-input__field {
    border-color: var(--color-danger-border);
  }

  .barcode-input--error .barcode-input__field:focus {
    box-shadow: 0 0 0 3px var(--color-danger-subtle);
  }

  .barcode-input__error {
    font-size: var(--text-sm);
    color: var(--color-danger-text);
    margin: 0;
  }
</style>
