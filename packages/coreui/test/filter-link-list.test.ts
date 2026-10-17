/** A filter is navigation: a named <nav> of links, the current one marked for assistive technology. */
import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import FilterLinkList from '../src/lib/FilterLinkList/FilterLinkList.svelte';

const html = render(FilterLinkList, {
  props: {
    label: 'Filter by status',
    links: [
      { href: '/receipt', label: 'All', current: false },
      { href: '/receipt?status=pending', label: 'Pending', current: true },
    ],
  },
}).body;

describe('FilterLinkList', () => {
  it('is a navigation landmark named by its label', () => {
    expect(html).toMatch(/<nav[^>]*aria-label="Filter by status"/);
  });

  it('renders each option as a link', () => {
    expect(html).toMatch(/<a[^>]*href="\/receipt"/);
    expect(html).toMatch(/<a[^>]*href="\/receipt\?status=pending"/);
  });

  it('marks only the current option', () => {
    expect(html.match(/aria-current="page"/g)).toHaveLength(1);
    expect(html).toMatch(/<a[^>]*href="\/receipt\?status=pending"[^>]*aria-current="page"|<a[^>]*aria-current="page"[^>]*href="\/receipt\?status=pending"/);
  });
});
