/**
 * Keyboard reachability and visible focus, on the page built for it.
 *
 * Tabs through /dev/theme from the top and checks every stop inside the three panels has
 * a visible indicator — an outline or a box-shadow — while focused (WCAG 2.4.7, and the
 * reason 2.4.11 exists). axe cannot check this: focus styles only exist while focused.
 */
import { expect, test } from '@playwright/test';

const MAX_STOPS = 400;

type Stop = { panel: string | null; description: string; visible: boolean };

test.use({ colorScheme: 'light' });

test('every focus stop in the theme panels shows a visible indicator', async ({ page }) => {
  await page.goto('/dev/theme');
  await page.waitForLoadState('networkidle');

  const stops: Stop[] = [];
  for (let index = 0; index < MAX_STOPS; index++) {
    await page.keyboard.press('Tab');
    const stop = await page.evaluate(() => {
      const element = document.activeElement;
      if (!element || element === document.body) return null;
      const style = getComputedStyle(element);
      const outline = style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0;
      const shadow = style.boxShadow !== 'none';
      const label =
        element.getAttribute('aria-label') ?? element.textContent?.trim().slice(0, 40) ?? '';
      return {
        panel: element.closest('.theme__panel')?.id ?? null,
        description: `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ''} “${label}”`,
        visible: outline || shadow,
      };
    });
    if (stop === null) break;
    // Once focus has passed the last panel and wrapped to the page chrome, the walk is done.
    if (stops.length > 0 && stops.at(-1)?.panel === 'rtl-top' && stop.panel === null) break;
    stops.push(stop);
  }

  const panelStops = stops.filter((stop) => stop.panel !== null);
  expect(panelStops.length, 'focus stops inside the panels').toBeGreaterThan(30);
  // Every panel was reached, so nothing earlier on the page trapped focus.
  for (const panel of ['light-top', 'dark-top', 'rtl-top']) {
    expect(
      panelStops.some((stop) => stop.panel === panel),
      `reached ${panel}`
    ).toBe(true);
  }

  const invisible = panelStops
    .filter((stop) => !stop.visible)
    .map((stop) => `${stop.panel}: ${stop.description}`);
  expect(invisible, 'stops with no visible focus indicator').toEqual([]);
});
