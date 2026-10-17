<!-- A text input tuned for barcode scanners. Place it inside a coreui Field, which supplies its
     label, hint and error: the input takes the Field's id, description and state from context. -->
<script lang="ts">
  import { useField } from '@sveltebuilder/coreui';

  type Props = {
    onScan: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    class?: string | undefined;
  };

  let { onScan, placeholder, disabled, class: extraClass }: Props = $props();

  const field = useField();

  // Scanners emit characters very quickly (< 50ms between keystrokes) then send Enter. Regular
  // keyboard input is slower. Scanner input is detected by inter-keystroke speed and flushed
  // immediately on Enter.
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

  const resolvedDisabled = $derived(disabled ?? field?.disabled ?? false);

  const classes = $derived(
    ['barcode-input', field?.['aria-invalid'] ? 'barcode-input--error' : '', extraClass ?? '']
      .filter(Boolean)
      .join(' ')
  );
</script>

<div class={classes}>
  <span class="barcode-input__icon" aria-hidden="true">
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1" y="3" width="1.5" height="10" fill="currentColor" />
      <rect x="4" y="3" width="1" height="10" fill="currentColor" />
      <rect x="6.5" y="3" width="2" height="10" fill="currentColor" />
      <rect x="10" y="3" width="1" height="10" fill="currentColor" />
      <rect x="12.5" y="3" width="1.5" height="10" fill="currentColor" />
    </svg>
  </span>
  <input
    id={field?.id}
    type="text"
    class="barcode-input__control"
    bind:value={inputValue}
    {placeholder}
    disabled={resolvedDisabled}
    required={field?.required}
    autocomplete="off"
    autocorrect="off"
    autocapitalize="off"
    spellcheck={false}
    aria-invalid={field?.['aria-invalid']}
    aria-describedby={field?.['aria-describedby']}
    onkeydown={handleKeydown}
    oninput={handleInput}
  />
</div>
