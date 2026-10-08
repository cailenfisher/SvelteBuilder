/**
 * Every showcase page, server-rendered and hydrated, in light, dark and right-to-left:
 * no WCAG 2.2 A/AA violation axe can detect, no runtime error, no missing copy.
 *
 * This is the automated half of the WCAG 2.2 AA audit, not the audit. axe finds roughly
 * a third of real-world failures — contrast, names, roles, ARIA misuse, landmarks — and
 * nothing about whether a flow makes sense to a screen-reader user. The keyboard walk in
 * focus.spec.ts adds focus visibility; the rest is still human review.
 */
import { expect, test, type Page } from '@playwright/test';
import { SHOWCASE } from '../src/lib/catalog';
import { axeViolations } from './axe';

const MODES = [
  { name: 'light', colorScheme: 'light', locale: 'en' },
  { name: 'dark', colorScheme: 'dark', locale: 'en' },
  { name: 'rtl', colorScheme: 'light', locale: 'ar' },
] as const;

const PAGES = [
  '/',
  '/dev/theme',
  ...SHOWCASE.flatMap((section) =>
    section.pages.map((page) => `/dev/${section.slug}/${page.slug}`)
  ),
];

/** Uncaught exceptions and console errors, which is how a failed hydration shows up. */
function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return errors;
}

for (const mode of MODES) {
  test.describe(mode.name, () => {
    test.use({ colorScheme: mode.colorScheme });

    for (const path of PAGES) {
      test(path, async ({ page, context, baseURL }) => {
        await context.addCookies([{ name: 'locale', value: mode.locale, url: baseURL ?? '' }]);
        const errors = collectErrors(page);

        const response = await page.goto(path);
        expect(response?.status(), 'status').toBe(200);
        // The client bundle has loaded and hydrated by the time the network settles.
        await page.waitForLoadState('networkidle');

        // Soft, so one run reports every kind of failure on the page, not only the first.
        await expect.soft(page.locator('html')).toHaveAttribute('lang', mode.locale);
        expect
          .soft(await page.locator('body').innerText(), 'missing copy')
          .not.toContain('[missing:');

        expect.soft(await axeViolations(page), 'axe violations').toEqual([]);
        expect.soft(errors, 'runtime errors').toEqual([]);
      });
    }
  });
}
