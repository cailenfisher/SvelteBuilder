import { getContext, setContext } from 'svelte';

/**
 * Marks the inside of a MenuGroup or MenuRadioGroup.
 *
 * MenuLabel wraps Bits UI's GroupHeading, which throws outside a group, and the throw empties the
 * whole menu. Bits UI's own group context is private, so the group components set this one and
 * MenuLabel checks it before rendering a heading.
 */
const MENU_GROUP = Symbol('coreui.menu-group');

export function setMenuGroup(): void {
  setContext(MENU_GROUP, true);
}

export function insideMenuGroup(): boolean {
  return getContext<boolean | undefined>(MENU_GROUP) ?? false;
}
