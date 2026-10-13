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
  const invalid = $derived(Boolean(field?.error));

  // Field renders the hint only when there is no error, so point at whichever one exists.
  const describedBy = $derived.by(() => {
    if (!field) return undefined;
    if (field.error) return field.errorId;
    return field.hint ? field.hintId : undefined;
  });

  const classes = $derived(
    ['barcode-input', invalid ? 'barcode-input--error' : '', extraClass ?? '']
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
    aria-invalid={invalid ? 'true' : undefined}
    aria-describedby={describedBy}
    onkeydown={handleKeydown}
    oninput={handleInput}
  />
</div>

<style>
  .barcode-input {
    position: relative;
    display: flex;
    align-items: center;
  }

  .barcode-input__icon {
    position: absolute;
    inset-inline-start: var(--space-3);
    color: var(--text-soft);
    pointer-events: none;
    display: flex;
    align-items: center;
  }

  .barcode-input__control {
    width: 100%;
    height: 2.5rem;
    padding-inline: calc(var(--space-3) + 16px + var(--space-2)) var(--space-3);
    background: var(--surface);
    border: 1px solid var(--border-color);
    border-radius: var(--radius);
    color: var(--text);
    font-size: var(--text-base);
    font-family: var(--font-mono);
    outline: none;
    transition: border-color var(--duration) var(--ease), box-shadow var(--duration) var(--ease);
  }

  .barcode-input__control:focus {
    border-color: var(--brand);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--brand) 20%, transparent);
  }

  .barcode-input__control:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .barcode-input--error .barcode-input__control {
    border-color: var(--danger);
  }

  .barcode-input--error .barcode-input__control:focus {
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--danger) 20%, transparent);
  }
</style>
