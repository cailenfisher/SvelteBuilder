<!-- DateTimePicker: timezone-aware date and time input.
     Camp 1 — i18n-agnostic. Value is an ISO 8601 string with timezone offset.
     Uses native <input type="datetime-local"> backed by a timezone-aware wrapper.
     Consumers must pass the IANA timezone name (e.g. 'America/New_York') for
     accurate offset serialization. -->
<script lang="ts">
  import { useField } from './use-field.js';

  type Props = {
    value?: string;
    onValueChange?: (iso: string | null) => void;
    timezone?: string;
    min?: string;
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
  const describedBy = $derived.by(() => {
    const parts: string[] = [];
    if (field?.hintId) parts.push(field.hintId);
    if (field?.errorId) parts.push(field.errorId);
    return parts.length ? parts.join(' ') : undefined;
  });

  // Convert a UTC ISO string to a datetime-local value (YYYY-MM-DDTHH:mm)
  // in the target timezone.
  function toLocalDateTimeString(iso: string, tz: string): string {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      // Use Intl.DateTimeFormat to format in the target timezone
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: tz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).formatToParts(d);

      const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
      return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
    } catch {
      return '';
    }
  }

  // Convert a datetime-local string back to an ISO string with tz offset.
  function toIsoWithOffset(local: string, tz: string): string | null {
    if (!local) return null;
    try {
      // Create a Date by interpreting the local string in the target timezone
      const d = new Date(
        new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' })
          .format(new Date(local + 'Z')) // Initial parse
          .replace(/(\d{4})-(\d{2})-(\d{2})/, '$1-$2-$3T') + local.slice(11) + ':00',
      );
      // Compute offset in target tz
      const utc = d.getTime();
      const tzDate = new Date(local);
      const offsetMs = tzDate.getTime() - utc;
      const offsetMin = Math.round(offsetMs / 60000);
      const sign = offsetMin >= 0 ? '+' : '-';
      const abs = Math.abs(offsetMin);
      const hh = String(Math.floor(abs / 60)).padStart(2, '0');
      const mm = String(abs % 60).padStart(2, '0');
      return new Date(local).toISOString().replace('Z', `${sign}${hh}:${mm}`);
    } catch {
      return null;
    }
  }

  const localValue = $derived(toLocalDateTimeString(value, timezone));

  function handleChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const iso = toIsoWithOffset(input.value, timezone);
    if (onValueChange) onValueChange(iso);
    else value = iso ?? '';
  }
</script>

<input
  type="datetime-local"
  id={fieldId}
  {name}
  value={localValue}
  {min}
  {max}
  {disabled}
  {required}
  aria-describedby={describedBy}
  class={['datetime-picker', extraClass ?? ''].filter(Boolean).join(' ')}
  onchange={handleChange}
/>
