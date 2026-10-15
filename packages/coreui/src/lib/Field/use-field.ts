import { getContext, setContext } from 'svelte';

const FIELD = 'field';

/**
 * Everything a `Field` shares with the controls inside it. Internal to coreui: the public surface
 * is `FieldControl`, through `useField()`.
 */
export type FieldContext = {
  readonly id: string;
  /** The Field's <label>. For controls a `for` attribute cannot name, such as a button trigger. */
  readonly labelId: string;
  readonly error: string | undefined;
  readonly hint: string | undefined;
  readonly hintId: string;
  readonly errorId: string;
  /** The error's id when there is an error, otherwise the hint's, otherwise nothing. */
  readonly describedBy: string | undefined;
  readonly required: boolean;
  readonly disabled: boolean;
};

/**
 * What a control inside a `Field` puts on its focusable element, under the HTML attribute names, so
 * a native control can spread it: `<input {...field} />`.
 */
export type FieldControl = {
  readonly id: string;
  readonly 'aria-describedby': string | undefined;
  readonly 'aria-invalid': true | undefined;
  readonly required: boolean;
  readonly disabled: boolean;
};

/** Called once by `Field`. Not exported from the package. */
export function setFieldContext(context: FieldContext): void {
  setContext(FIELD, context);
}

/**
 * The whole context, for coreui's own controls that need more than `FieldControl`: `Select` and
 * `RadioGroup` name themselves by the label's id. Not exported from the package.
 */
export function getFieldContext(): FieldContext | null {
  return getContext<FieldContext | null>(FIELD) ?? null;
}

/**
 * The attributes a control inherits from the nearest `Field`, or null outside one, in which case
 * the control falls back to its own props.
 *
 * coreui's controls use it, and a custom control can too: logistic's `BarcodeInput` does.
 *
 *   const field = useField();
 *   <input {...field} />
 *
 * Each property is read live, so the control follows the Field's error, hint and state as they
 * change. What coreui's own controls take from it:
 *
 * - Input, Textarea, Switch, DateTimePicker: all five attributes.
 * - Select: the same, plus the label's id (through the internal context) for aria-labelledby.
 * - RadioGroup: disabled, plus the label's id.
 * - Checkbox: disabled only. It carries its own label, so the Field's label is not wired to it.
 */
export function useField(): FieldControl | null {
  const context = getFieldContext();
  if (!context) return null;
  return {
    get id() {
      return context.id;
    },
    get 'aria-describedby'() {
      return context.describedBy;
    },
    get 'aria-invalid'() {
      return context.error ? true : undefined;
    },
    get required() {
      return context.required;
    },
    get disabled() {
      return context.disabled;
    },
  };
}
