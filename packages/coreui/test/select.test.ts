/**
 * Select's trigger shows the selected item's label, not its value. Bits UI can only resolve the
 * label from items that are mounted, and the list is not until it opens — so the closed trigger
 * (the only state anyone sees on page load) showed `all_rights_reserved`.
 */
import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import LicenseSelect from './fixtures/LicenseSelect.svelte';

const html = (value?: string) => render(LicenseSelect, { props: { value } }).body;

describe('Select trigger text', () => {
  it('shows the label of the selected item, not its value', () => {
    const out = html('all_rights_reserved');
    expect(out).toContain('All rights reserved');
    expect(out).not.toMatch(/>\s*all_rights_reserved\s*</);
  });

  it('shows the placeholder when nothing is selected', () => {
    expect(html('')).toContain('Choose a license');
  });

  it('does not render the registration pass into the page', () => {
    // The items belong to the portaled list, which is closed: no item markup in the page.
    expect(html('creative_commons')).not.toContain('select-item');
  });
});
