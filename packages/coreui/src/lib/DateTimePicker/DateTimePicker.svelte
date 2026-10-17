<!-- DateTimePicker: timezone-aware date and time input.
     Takes no copy. Value is an ISO 8601 string with timezone offset.
     Uses native <input type="datetime-local"> backed by a timezone-aware wrapper.
     Consumers must pass the IANA timezone name (e.g. 'America/New_York') for
     accurate offset serialization. -->
<script lang="ts">
  import { useField } from '../Field/use-field.js';
  import { toIsoDateTime, toLocalDateTime } from './date-time-picker.js';

  type Props = {
    value?: string;
    onValueChange?: (iso: string | null) => void;
    timezone?: string;
    /** The earliest instant allowed, as ISO 8601 like `value`. */
    min?: string;
    /** The latest instant allowed, as ISO 8601 like `value`. */
    max?: string;
    disabled?: boolean;
    required?: boolean;
    name?: string;
    id?: string;
    class?: string | undefined;
  };

  let {
    value = $bindable(''),
    onValueChange,
    timezone = 'UTC',
    min,
    max,
    disabled = false,
    required = false,
    name,
    id: idProp,
    class: extraClass,
  }: Props = $props();

  const field = useField();
  const fieldId = $derived(idProp ?? field?.id);


  const localValue = $derived(toLocalDateTime(value, timezone));

  function handleChange(event: Event & { currentTarget: HTMLInputElement }) {
    const iso = toIsoDateTime(event.currentTarget.value, timezone);
    // Both, not either: a caller may bind the value and listen for changes at once.
    value = iso ?? '';
    onValueChange?.(iso);
  }
</script>

<input
  type="datetime-local"
  id={fieldId}
  {name}
  value={localValue}
  min={min ? toLocalDateTime(min, timezone) : undefined}
  max={max ? toLocalDateTime(max, timezone) : undefined}
  {disabled}
  {required}
  aria-describedby={field?.['aria-describedby']}
  class={['date-time-picker', extraClass ?? ''].filter(Boolean).join(' ')}
  onchange={handleChange}
/>
