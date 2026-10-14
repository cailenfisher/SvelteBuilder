import { getContext } from 'svelte';

export type FieldContext = {
  readonly id: string;
  /** The Field's <label>. For controls a `for` attribute cannot name, such as a button trigger. */
  readonly labelId: string;
  readonly error: string | undefined;
  readonly hint: string | undefined;
  readonly hintId: string;
  readonly errorId: string;
  readonly required: boolean;
  readonly disabled: boolean;
};

/**
 * Retrieves the nearest Field context, if any.
 *
 * A control inside a Field calls this to inherit what the Field owns, so callers don't wire it by
 * hand. What each control takes from it:
 *
 * - Input, Textarea, Switch: id (so the Field's label points at it), aria-describedby, required,
 *   disabled, and the error state.
 * - Select: id, the label (via aria-labelledby), aria-describedby, disabled, and the error state.
 * - DateTimePicker: id and aria-describedby.
 * - RadioGroup: the label (via aria-labelledby) and disabled.
 * - Checkbox: disabled only. It carries its own label, so the Field's label is not wired to it.
 *
 * Returns null when the component is used outside a Field, in which case the component falls back
 * to its own props.
 *
 * Custom controls may call it too; that is why it and FieldContext are exported.
 *
 * Usage:
 *   const field = useField();
 *   const resolvedId = $derived(props.id ?? field?.id);
 */
export function useField(): FieldContext | null {
  return getContext<FieldContext | null>('field') ?? null;
}
