/**
 * Overlays audited open. The page-level run in a11y.spec.ts sees every overlay closed,
 * which is the state least likely to be wrong; these open each kind and check what a
 * keyboard user gets: focus moves into it, axe passes on it, Escape closes it and focus
 * returns to what opened it.
 */
import { expect, test } from '@playwright/test';
import { axeViolations } from './axe';

const OVERLAYS = [
  { path: '/dev/coreui/dialog', trigger: 'Open md' },
  { path: '/dev/coreui/dialog', trigger: 'Open right' },
  { path: '/dev/coreui/confirm-dialog', trigger: 'Delete supplier' },
  { path: '/dev/coreui/menu', trigger: 'Actions' },
  { path: '/dev/coreui/popover', trigger: 'Stock detail' },
] as const;

for (const overlay of OVERLAYS) {
  test(`${overlay.path}: ${overlay.trigger}`, async ({ page }) => {
    // An overlay that throws while rendering simply never appears; say why.
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto(overlay.path);
    await page.waitForLoadState('networkidle');

    const trigger = page.getByRole('button', { name: overlay.trigger, exact: true });
    await trigger.focus();
    await page.keyboard.press('Enter');

    // A trigger that names what it opened is checked through that name, which also proves
    // its aria-controls is true. A Popover trigger names nothing (its content has no role),
    // and ConfirmDialog is opened by the caller's own button; both are found directly.
    const controls = await trigger.getAttribute('aria-controls');
    const opened = controls
      ? page.locator(`[id="${controls}"]`)
      : page.locator('[role="alertdialog"], .popover[data-state="open"]').first();
    await expect(opened, `opened content (errors: ${errors.join('; ') || 'none'})`).toBeVisible();
    // Focus moved inside the overlay rather than staying on the page behind it.
    await expect
      .poll(() => opened.evaluate((element) => element.contains(document.activeElement)))
      .toBe(true);

    expect(await axeViolations(page), 'axe violations with the overlay open').toEqual([]);

    await page.keyboard.press('Escape');
    await expect(opened).toBeHidden();
    await expect(trigger).toBeFocused();
    expect(errors, 'runtime errors').toEqual([]);
  });
}

test('select opens a listbox from the keyboard and closes back to its trigger', async ({ page }) => {
  await page.goto('/dev/coreui/select');
  await page.waitForLoadState('networkidle');

  // A select-only combobox, named by its Field label plus its current value.
  const trigger = page.getByRole('combobox', { name: 'Carrier Choose a carrier' });
  await trigger.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('listbox')).toBeVisible();

  expect(await axeViolations(page), 'axe violations with the listbox open').toEqual([]);

  await page.keyboard.press('Escape');
  await expect(page.getByRole('listbox')).toBeHidden();
  await expect(trigger).toBeFocused();
});
