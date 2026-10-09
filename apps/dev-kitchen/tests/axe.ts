import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

/**
 * axe over the page, as one line per violating node.
 *
 * One exemption is applied, and only one: WCAG 1.4.3 does not require contrast for "text
 * that is part of an inactive user interface component". axe honours it for a native
 * `disabled` control but not for a Bits UI checkbox, switch or radio, which is a button
 * whose label sits in a `[data-disabled]` wrapper, nor for a `<label for>` naming a
 * disabled control. A color-contrast node inside one of those is dropped; every other
 * rule, and contrast everywhere else, still applies.
 */
export async function axeViolations(page: Page): Promise<string[]> {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  const lines: string[] = [];

  for (const violation of results.violations) {
    for (const node of violation.nodes) {
      const selector = node.target.join(' ');
      if (violation.id === 'color-contrast' && (await isInactive(page, selector))) continue;
      lines.push(`${violation.id} (${violation.impact}): ${selector} — ${violation.help}`);
    }
  }
  return lines;
}

function isInactive(page: Page, selector: string): Promise<boolean> {
  return page.evaluate((target) => {
    const element = document.querySelector(target);
    if (!element) return false;
    const inactive = (candidate: Element | null) =>
      candidate?.closest('[data-disabled], [aria-disabled="true"], :disabled') != null;
    if (inactive(element)) return true;
    const label = element.closest('label');
    const control = label?.htmlFor ? document.getElementById(label.htmlFor) : null;
    return inactive(control);
  }, selector);
}
