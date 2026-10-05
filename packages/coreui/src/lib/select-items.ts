export type SelectItemRecord = { value: string; label: string; disabled?: boolean };

/**
 * The channel by which a SelectItem tells its Select what it is called.
 *
 * Bits UI resolves the trigger's text from the Root's `items` prop, or failing that from an item
 * that is mounted — and the items live in a portal that is not mounted until the list opens. So
 * a Select built from SelectItem children showed the selected *value* (`all_rights_reserved`)
 * until opened. Select therefore renders its children once, silently, with this context set;
 * each SelectItem sees it, registers here and renders nothing, and Select hands the result to
 * Bits UI as `items`.
 */
export type SelectItemRegistry = {
  set: (record: SelectItemRecord) => void;
  delete: (value: string) => void;
};

export const SELECT_ITEM_REGISTRY = Symbol('coreui.select-item-registry');
