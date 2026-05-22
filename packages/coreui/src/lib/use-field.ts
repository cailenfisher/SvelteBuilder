import { getContext } from 'svelte';

type FieldContext = {
  readonly id: string;
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
 * Components that can appear inside a Field (Input, Select, Textarea,
 * Checkbox, RadioGroup, Switch) call this to inherit id, aria-describedby,
 * required, and disabled automatically — so callers don't have to wire
 * those props manually when using the Field wrapper.
 *
 * Returns null when the component is used outside a Field, in which case
 * the component falls back to its own props.
 *
 * Usage:
 *   const field = useField();
 *   const resolvedId = $derived(props.id ?? field?.id);
 */
export function useField(): FieldContext | null {
  return getContext<FieldContext | null>('field') ?? null;
}
