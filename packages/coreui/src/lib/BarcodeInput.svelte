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

  const inputId = $props.id();

  const classes = $derived(
    ['barcode-input', error ? 'error' : '', extraClass ?? '']
      .filter(Boolean)
      .join(' ')
  );
</script>

<div class={classes}>
  {#if label}
    <label class="label" for={inputId}>{label}</label>
  {/if}

  <div class="input-wrap">
    <span class="icon" aria-hidden="true">
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
      class="field"
      bind:value={inputValue}
      {placeholder}
      {disabled}
      autocomplete="off"
      autocorrect="off"
      autocapitalize="off"
      spellcheck={false}
      aria-invalid={error ? 'true' : undefined}
      aria-describedby={error ? `${inputId}-error` : undefined}
      onkeydown={handleKeydown}
      oninput={handleInput}
    />
  </div>

  {#if error}
    <p id={`${inputId}-error`} class="error-msg" role="alert">
      {error}
    </p>
  {/if}
</div>