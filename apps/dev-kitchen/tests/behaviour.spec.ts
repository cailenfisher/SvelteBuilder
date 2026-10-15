/**
 * What the interactive components do, as opposed to how they look or whether axe passes them:
 * keyboard interaction, controlled against bound values, callbacks firing exactly once per
 * change, focus going in and coming back, and disabled states. Each showcase page's "Callbacks"
 * example counts its callbacks in a CallbackLog line, which is what these read.
 *
 * Server rendering (the package vitest suites) proves markup. Only a browser proves behaviour,
 * and the first run of this file found DateTimePicker dropping its bound value whenever a caller
 * also listened for changes.
 */
import { expect, test, type Locator, type Page } from '@playwright/test';

/** One showcase example, found by its heading. */
const example = (page: Page, title: string): Locator =>
  page.locator('section.example').filter({ has: page.getByRole('heading', { name: title, exact: true }) });

/** A CallbackLog line, by the callback name it reports. */
const callbackLog = (scope: Locator, name: string): Locator =>
  scope.getByRole('status').filter({ hasText: new RegExp(`^\\s*${name}:`) });

async function open(page: Page, path: string) {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(path);
  await page.waitForLoadState('networkidle');
  return errors;
}

test.describe('Checkbox', () => {
  test('controlled and bound each report one change per toggle, from pointer and keyboard', async ({ page }) => {
    const errors = await open(page, '/dev/coreui/checkbox');
    const callbacks = example(page, 'Callbacks');

    const controlled = callbacks.getByRole('checkbox', { name: 'Controlled' });
    await controlled.click();
    await expect(controlled).toBeChecked();
    await expect(callbackLog(callbacks, 'Controlled onCheckedChange')).toHaveText(/1 call, last true/);
    await page.keyboard.press('Space');
    await expect(controlled).not.toBeChecked();
    await expect(callbackLog(callbacks, 'Controlled onCheckedChange')).toHaveText(/2 calls, last false/);

    const bound = callbacks.getByRole('checkbox', { name: 'Bound' });
    await bound.focus();
    await page.keyboard.press('Space');
    await expect(bound).toBeChecked();
    await expect(callbackLog(callbacks, 'Bound onCheckedChange')).toHaveText(/1 call, last true/);
    await expect(callbacks.getByText('Bound value: true')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('a disabled checkbox cannot be focused or toggled', async ({ page }) => {
    await open(page, '/dev/coreui/checkbox');
    const disabled = page.getByRole('checkbox', { name: 'Disabled', exact: true });
    await expect(disabled).toBeDisabled();
    await disabled.click({ force: true });
    await expect(disabled).not.toBeChecked();
  });
});

test.describe('Switch', () => {
  test('controlled and bound each report one change per toggle', async ({ page }) => {
    const errors = await open(page, '/dev/coreui/switch');
    const callbacks = example(page, 'Callbacks');

    const controlled = callbacks.getByRole('switch', { name: 'Controlled' });
    await controlled.focus();
    await page.keyboard.press('Space');
    await expect(controlled).toBeChecked();
    await expect(callbackLog(callbacks, 'Controlled onCheckedChange')).toHaveText(/1 call, last true/);
    await page.keyboard.press('Enter');
    await expect(controlled).not.toBeChecked();
    await expect(callbackLog(callbacks, 'Controlled onCheckedChange')).toHaveText(/2 calls, last false/);

    await callbacks.getByRole('switch', { name: 'Bound' }).click();
    await expect(callbackLog(callbacks, 'Bound onCheckedChange')).toHaveText(/1 call, last true/);
    await expect(callbacks.getByText('Bound value: true')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('a disabled switch cannot be toggled', async ({ page }) => {
    await open(page, '/dev/coreui/switch');
    const disabled = page.getByRole('switch', { name: 'Disabled', exact: true });
    await expect(disabled).toBeDisabled();
    await disabled.click({ force: true });
    await expect(disabled).not.toBeChecked();
  });
});

test.describe('RadioGroup', () => {
  test('arrow keys move the selection and report it once per move', async ({ page }) => {
    const errors = await open(page, '/dev/coreui/radio-group');
    const callbacks = example(page, 'Callbacks');

    await callbacks.getByRole('radio', { name: 'Controlled ground' }).focus();
    await page.keyboard.press('ArrowDown');
    await expect(callbacks.getByRole('radio', { name: 'Controlled express' })).toBeChecked();
    await expect(callbacks.getByRole('radio', { name: 'Controlled express' })).toBeFocused();
    await expect(callbackLog(callbacks, 'onValueChange')).toHaveText(/1 call, last express/);
    await page.keyboard.press('ArrowDown');
    await expect(callbackLog(callbacks, 'onValueChange')).toHaveText(/2 calls, last freight/);
    expect(errors).toEqual([]);
  });

  test('arrow keys skip a disabled item', async ({ page }) => {
    await open(page, '/dev/coreui/radio-group');
    const vertical = example(page, 'RadioGroup, vertical');
    await vertical.getByRole('radio', { name: 'Express' }).click();
    await page.keyboard.press('ArrowDown');
    await expect(vertical.getByRole('radio', { name: 'Ground' })).toBeChecked();
    await expect(vertical.getByText('Carrier: ground')).toBeVisible();
  });
});

test.describe('Select', () => {
  test('the keyboard opens it, chooses an option once, and returns focus to the trigger', async ({ page }) => {
    const errors = await open(page, '/dev/coreui/select');
    const callbacks = example(page, 'Callbacks');
    const trigger = callbacks.getByRole('combobox', { name: /^Controlled service/ });

    await trigger.focus();
    await page.keyboard.press('Enter');
    const listbox = page.getByRole('listbox');
    await expect(listbox).toBeVisible();
    await expect(listbox.getByRole('option', { name: 'Freight (unavailable)' })).toHaveAttribute(
      'aria-disabled',
      'true'
    );

    // Escape closes without choosing anything.
    await page.keyboard.press('Escape');
    await expect(listbox).toBeHidden();
    await expect(trigger).toBeFocused();
    await expect(callbackLog(callbacks, 'Controlled onValueChange')).toHaveText(/0 calls/);

    await page.keyboard.press('Enter');
    await expect(listbox).toBeVisible();
    await page.keyboard.press('ArrowDown');
    await expect(listbox.getByRole('option', { name: 'Express' })).toHaveAttribute('data-highlighted', '');
    await page.keyboard.press('Enter');
    await expect(listbox).toBeHidden();
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveAccessibleName('Controlled service Express');
    await expect(callbackLog(callbacks, 'Controlled onValueChange')).toHaveText(/1 call, last express/);
    expect(errors).toEqual([]);
  });

  test('a bound select submits its value with the form', async ({ page }) => {
    await open(page, '/dev/coreui/select');
    const callbacks = example(page, 'Callbacks');
    await callbacks.getByRole('combobox', { name: /^Bound service/ }).click();
    await page.getByRole('option', { name: 'Express' }).click();
    await expect(callbackLog(callbacks, 'Bound onValueChange')).toHaveText(/1 call, last express/);
    await callbacks.getByRole('button', { name: 'Submit services' }).click();
    await expect(callbacks.getByText('Bound value: express. Submitted: express')).toBeVisible();
  });
});

test.describe('Tabs', () => {
  test('arrow keys move between tabs and select each once', async ({ page }) => {
    const errors = await open(page, '/dev/coreui/tabs');
    const callbacks = example(page, 'Callbacks');

    await callbacks.getByRole('tab', { name: 'Controlled details' }).focus();
    await page.keyboard.press('ArrowRight');
    const lines = callbacks.getByRole('tab', { name: 'Controlled lines' });
    await expect(lines).toBeFocused();
    await expect(lines).toHaveAttribute('aria-selected', 'true');
    await expect(callbacks.getByRole('tabpanel')).toHaveText('Lines panel.');
    await expect(callbackLog(callbacks, 'onValueChange')).toHaveText(/1 call, last lines/);
    expect(errors).toEqual([]);
  });

  test('arrow keys skip a disabled tab', async ({ page }) => {
    await open(page, '/dev/coreui/tabs');
    const horizontal = example(page, 'Horizontal');
    await horizontal.getByRole('tab', { name: 'History' }).click();
    await page.keyboard.press('ArrowRight');
    await expect(horizontal.getByRole('tab', { name: 'Details' })).toBeFocused();
  });
});

test.describe('Accordion', () => {
  test('Enter opens and closes an item, reporting each change once', async ({ page }) => {
    const errors = await open(page, '/dev/coreui/accordion');
    const callbacks = example(page, 'Callbacks');
    const returns = callbacks.getByRole('button', { name: 'Controlled returns' });

    await returns.focus();
    await page.keyboard.press('Enter');
    await expect(returns).toHaveAttribute('aria-expanded', 'true');
    await expect(callbacks.getByText('Graded on arrival.')).toBeVisible();
    await expect(callbackLog(callbacks, 'onValueChange')).toHaveText(/1 call, last returns/);
    await page.keyboard.press('Enter');
    await expect(returns).toHaveAttribute('aria-expanded', 'false');
    await expect(callbackLog(callbacks, 'onValueChange')).toHaveText(/2 calls/);
    expect(errors).toEqual([]);
  });
});

test.describe('Dialog', () => {
  test('opens from its trigger and closes by Escape or its close button, returning focus each time', async ({ page }) => {
    const errors = await open(page, '/dev/coreui/dialog');
    const callbacks = example(page, 'Callbacks');
    const trigger = callbacks.getByRole('button', { name: 'Open controlled' });
    const dialog = page.getByRole('dialog', { name: 'Controlled dialog' });

    await trigger.focus();
    await page.keyboard.press('Enter');
    await expect(dialog).toBeVisible();
    await expect.poll(() => dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
    await expect(callbackLog(callbacks, 'onOpenChange')).toHaveText(/1 call, last true/);

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
    await expect(callbackLog(callbacks, 'onOpenChange')).toHaveText(/2 calls, last false/);

    await page.keyboard.press('Enter');
    await dialog.getByRole('button', { name: 'Close controlled dialog' }).click();
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
    await expect(callbackLog(callbacks, 'onOpenChange')).toHaveText(/4 calls, last false/);
    expect(errors).toEqual([]);
  });

  test('keeps focus inside while open', async ({ page }) => {
    await open(page, '/dev/coreui/dialog');
    await example(page, 'Callbacks').getByRole('button', { name: 'Open controlled' }).click();
    const dialog = page.getByRole('dialog', { name: 'Controlled dialog' });
    for (let stop = 0; stop < 4; stop++) {
      await page.keyboard.press('Tab');
      await expect.poll(() => dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
    }
  });
});

test.describe('Popover', () => {
  test('reports opening and closing once each and returns focus', async ({ page }) => {
    const errors = await open(page, '/dev/coreui/popover');
    const callbacks = example(page, 'Callbacks');
    const trigger = callbacks.getByRole('button', { name: 'Reorder detail' });

    await trigger.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByText('Reorder at 12 units.')).toBeVisible();
    await expect(callbackLog(callbacks, 'onOpenChange')).toHaveText(/1 call, last true/);
    await page.keyboard.press('Escape');
    await expect(page.getByText('Reorder at 12 units.')).toBeHidden();
    await expect(trigger).toBeFocused();
    await expect(callbackLog(callbacks, 'onOpenChange')).toHaveText(/2 calls, last false/);
    expect(errors).toEqual([]);
  });
});

test.describe('Tooltip', () => {
  test('shows on keyboard focus and hides on Escape', async ({ page }) => {
    await open(page, '/dev/coreui/popover');
    await example(page, 'Tooltip').getByRole('button', { name: 'On hand' }).focus();
    const tooltip = page.getByRole('tooltip', { name: 'Units on the shelf, including reserved' });
    await expect(tooltip).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(tooltip).toBeHidden();
  });
});

test.describe('Menu', () => {
  test('items, checkbox items and radio items each report once, and focus returns', async ({ page }) => {
    const errors = await open(page, '/dev/coreui/menu');
    const callbacks = example(page, 'Callbacks');
    const trigger = callbacks.getByRole('button', { name: 'Line actions' });
    const menu = page.getByRole('menu');

    /** Opens the menu from the keyboard and moves to the named item. */
    async function openTo(role: 'menuitem' | 'menuitemcheckbox' | 'menuitemradio', name: string) {
      await trigger.focus();
      await page.keyboard.press('Enter');
      await expect(menu).toBeVisible();
      const target = menu.getByRole(role, { name });
      for (let step = 0; step < 6 && !(await target.evaluate((element) => element === document.activeElement)); step++) {
        await page.keyboard.press('ArrowDown');
      }
      await expect(target).toBeFocused();
    }

    await openTo('menuitem', 'Split');
    await expect(callbackLog(callbacks, 'onOpenChange')).toHaveText(/1 call, last true/);
    await page.keyboard.press('Enter');
    await expect(menu).toBeHidden();
    await expect(trigger).toBeFocused();
    await expect(callbackLog(callbacks, 'onSelect')).toHaveText(/1 call, last Split/);
    await expect(callbackLog(callbacks, 'onOpenChange')).toHaveText(/2 calls, last false/);

    await openTo('menuitemcheckbox', 'Flag line');
    await page.keyboard.press('Enter');
    await expect(callbackLog(callbacks, 'onCheckedChange')).toHaveText(/1 call, last true/);

    await page.keyboard.press('Escape');
    await openTo('menuitemradio', 'Count in cases');
    await page.keyboard.press('Enter');
    await expect(callbackLog(callbacks, 'onValueChange')).toHaveText(/1 call, last case/);
    await expect(callbackLog(callbacks, 'onSelect')).toHaveText(/1 call/);
    expect(errors).toEqual([]);
  });

  test('a disabled item cannot be chosen', async ({ page }) => {
    await open(page, '/dev/coreui/menu');
    const everything = example(page, 'Everything a menu can hold');
    await everything.getByRole('button', { name: 'Actions' }).click();
    const archive = page.getByRole('menuitem', { name: 'Archive (disabled)' });
    await expect(archive).toHaveAttribute('aria-disabled', 'true');
    await archive.click({ force: true });
    await expect(everything.getByText('Last action: (nothing yet)')).toBeVisible();
  });
});

test.describe('ConfirmDialog', () => {
  test('Escape cancels once; the confirm button confirms once; focus returns to the opener', async ({ page }) => {
    const errors = await open(page, '/dev/coreui/confirm-dialog');
    const scope = example(page, 'ConfirmDialog');
    const opener = scope.getByRole('button', { name: 'Delete supplier' });
    const dialog = page.getByRole('alertdialog', { name: 'Delete this supplier?' });

    await opener.click();
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(opener).toBeFocused();
    await expect(callbackLog(scope, 'onCancel')).toHaveText(/1 call/);
    await expect(callbackLog(scope, 'onConfirm')).toHaveText(/0 calls/);

    await opener.click();
    await dialog.getByRole('button', { name: 'Delete' }).click();
    await expect(dialog).toBeHidden();
    await expect(opener).toBeFocused();
    await expect(callbackLog(scope, 'onConfirm')).toHaveText(/1 call/);
    await expect(callbackLog(scope, 'onCancel')).toHaveText(/1 call/);
    await expect(scope.getByText('Confirmed.')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('a loading confirm button cannot be pressed', async ({ page }) => {
    await open(page, '/dev/coreui/confirm-dialog');
    await page.getByRole('button', { name: 'Open a dialog mid-request' }).click();
    const publish = page.getByRole('alertdialog').getByRole('button', { name: /Publish/ });
    await expect(publish).toBeDisabled();
  });
});

test.describe('Tag', () => {
  test('its remove button reports once per press, from keyboard and pointer', async ({ page }) => {
    const errors = await open(page, '/dev/coreui/badge');
    const scope = example(page, 'Removable tags');

    await scope.getByRole('button', { name: 'Remove Logistics' }).focus();
    await page.keyboard.press('Enter');
    await expect(scope.getByRole('button', { name: 'Remove Logistics' })).toBeHidden();
    await expect(callbackLog(scope, 'onRemove')).toHaveText(/1 call, last Logistics/);
    await scope.getByRole('button', { name: 'Remove Commerce' }).click();
    await expect(callbackLog(scope, 'onRemove')).toHaveText(/2 calls, last Commerce/);
    expect(errors).toEqual([]);
  });
});

test.describe('InlineNotification', () => {
  test('its dismiss button reports once', async ({ page }) => {
    await open(page, '/dev/coreui/alert');
    const scope = example(page, 'InlineNotification');
    await scope.getByRole('button', { name: /Dismissible/ }).click();
    await expect(scope.getByText('Dismissible', { exact: true })).toBeHidden();
    await expect(callbackLog(scope, 'onDismiss')).toHaveText(/1 call/);
  });

  test('its action runs once per press', async ({ page }) => {
    await open(page, '/dev/coreui/alert');
    const scope = example(page, 'InlineNotification');
    await scope.getByRole('button', { name: 'Retry' }).click();
    await scope.getByRole('button', { name: 'Retry' }).click();
    await expect(scope.getByText('Retries: 2')).toBeVisible();
  });
});

test.describe('DataTable', () => {
  test('sortable headers report the next sort once, by pointer and keyboard', async ({ page }) => {
    const errors = await open(page, '/dev/coreui/data-table');
    const scope = example(page, 'Sorted and paged');

    await scope.getByRole('button', { name: /^Name/ }).click();
    await expect(callbackLog(scope, 'onSortChange')).toHaveText(/1 call, last \["name","desc"\]/);
    await expect(scope.getByRole('columnheader', { name: /^Name/ })).toHaveAttribute('aria-sort', 'descending');
    await expect(scope.getByRole('row').nth(1)).toContainText('Supplier 23');

    await scope.getByRole('button', { name: /^Country/ }).focus();
    await page.keyboard.press('Enter');
    await expect(callbackLog(scope, 'onSortChange')).toHaveText(/2 calls, last \["country","asc"\]/);
    expect(errors).toEqual([]);
  });

  test('paging reports the page asked for once, and a bound page follows it', async ({ page }) => {
    await open(page, '/dev/coreui/data-table');
    const scope = example(page, 'Sorted and paged');

    await scope.getByRole('button', { name: 'Next page' }).click();
    await expect(callbackLog(scope, 'onPageChange')).toHaveText(/1 call, last 2/);
    await expect(scope.getByText('Page 2, sorted by name asc')).toBeVisible();
    await expect(scope.getByRole('row').nth(1)).toContainText('Supplier 09');
    await expect(scope.getByRole('button', { name: 'Previous page' })).toBeEnabled();
  });
});

test.describe('Pagination', () => {
  test('a bound page follows the buttons and the page links', async ({ page }) => {
    await open(page, '/dev/coreui/data-table');
    const scope = example(page, 'Pagination on its own');
    await scope.getByRole('button', { name: 'Next page' }).click();
    await expect(scope.getByText('Page 4', { exact: true })).toBeVisible();
    await scope.getByRole('button', { name: 'Previous page' }).click();
    await scope.getByRole('button', { name: 'Previous page' }).click();
    await expect(scope.getByText('Page 2', { exact: true })).toBeVisible();
  });
});

test.describe('Table', () => {
  test('a sortable header cell reports once per press', async ({ page }) => {
    await open(page, '/dev/coreui/table');
    const scope = example(page, 'Caption, sortable header, footer');
    await scope.getByRole('button', { name: /^Quantity/ }).click();
    await expect(callbackLog(scope, 'onSort')).toHaveText(/1 call/);
    await expect(scope.getByRole('row').nth(1)).toContainText('NUT-M8');
  });
});

test.describe('DateTimePicker', () => {
  // A browser timezone far from the picker's: the picker must read the typed time in its own
  // timezone, not the browser's.
  test.use({ timezoneId: 'Pacific/Auckland' });

  test("a bound value and onValueChange both follow a typed time, in the picker's timezone", async ({ page }) => {
    const errors = await open(page, '/dev/coreui/date-time-picker');
    const scope = example(page, 'Bound value, UTC');
    const input = scope.getByLabel('Publish at');

    await expect(input).toHaveValue('2026-10-07T09:30');
    await input.fill('2026-10-08T14:45');
    await input.blur();
    await expect(scope.getByText('Value: 2026-10-08T14:45:00.000+00:00')).toBeVisible();
    await expect(callbackLog(scope, 'onValueChange')).toHaveText(/1 call, last 2026-10-08T14:45:00.000\+00:00/);
    expect(errors).toEqual([]);
  });

  test('min and max reach the input as wall-clock times in its timezone', async ({ page }) => {
    await open(page, '/dev/coreui/date-time-picker');
    const input = page.getByLabel('Embargo until (Tokyo)');
    await expect(input).toHaveAttribute('min', '2026-10-01T09:00');
    await expect(input).toHaveAttribute('max', '2027-01-01T08:59');
  });

  test('a disabled picker cannot be edited', async ({ page }) => {
    await open(page, '/dev/coreui/date-time-picker');
    await expect(page.getByLabel('Locked')).toBeDisabled();
  });
});

test.describe('Toast and the message bus', () => {
  test('a toast rendered directly reports its dismissal once', async ({ page }) => {
    await open(page, '/dev/coreui/toast');
    const scope = example(page, 'Toast, rendered directly');
    await scope.getByRole('button', { name: /Supplier saved/ }).click();
    await expect(scope.getByText('Supplier saved')).toBeHidden();
    await expect(callbackLog(scope, 'onDismiss')).toHaveText(/1 call/);
  });

  test('the region shows three toasts, queues the rest, and shows the next when one is dismissed', async ({ page }) => {
    const errors = await open(page, '/dev/coreui/toast');
    const scope = example(page, 'Through the bus (ToastRegion, MessageLiveRegion)');
    // The live region repeats each summary for screen readers, so look only at the toasts.
    const region = page.getByRole('region', { name: 'Notifications' });
    for (const severity of ['info', 'success', 'warning', 'danger']) {
      await scope.getByRole('button', { name: severity, exact: true }).click();
    }
    // The newest three are shown; the oldest waits.
    await expect(region.getByText('A danger toast')).toBeVisible();
    await expect(region.getByText('A success toast')).toBeVisible();
    await expect(region.getByText('A info toast')).toBeHidden();
    await expect(region.getByText('+1 more')).toBeVisible();

    await region.getByRole('button', { name: /A danger toast/ }).click();
    await expect(region.getByText('A danger toast')).toBeHidden();
    await expect(region.getByText('A info toast')).toBeVisible();
    await expect(region.getByText('+1 more')).toBeHidden();
    expect(errors).toEqual([]);
  });

  test("a toast's undo runs once", async ({ page }) => {
    await open(page, '/dev/coreui/toast');
    const scope = example(page, 'Through the bus (ToastRegion, MessageLiveRegion)');
    const region = page.getByRole('region', { name: 'Notifications' });
    await scope.getByRole('button', { name: 'With undo' }).click();
    await region.getByRole('button', { name: 'Undo' }).click();
    await expect(scope.getByText('Undone 1 time.')).toBeVisible();
    await expect(region.getByText('Shipment archived')).toBeHidden();
  });
});

test.describe('Switch, right to left', () => {
  // The thumb once slid out of its track in right-to-left and covered the neighbouring label's
  // first letter; axe cannot see overlap, so this measures it.
  test('a checked thumb stays inside its track in every direction', async ({ page }) => {
    await open(page, '/dev/theme');
    const controls = page.locator('.switch__control[data-state="checked"]');
    const count = await controls.count();
    expect(count).toBeGreaterThan(1);
    for (let index = 0; index < count; index++) {
      const control = controls.nth(index);
      const track = await control.boundingBox();
      const thumb = await control.locator('.switch__thumb').boundingBox();
      expect(track && thumb, 'switch geometry').toBeTruthy();
      if (!track || !thumb) continue;
      expect(thumb.x).toBeGreaterThanOrEqual(track.x - 0.5);
      expect(thumb.x + thumb.width).toBeLessThanOrEqual(track.x + track.width + 0.5);
    }
  });
});
