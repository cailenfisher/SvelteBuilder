/**
 * A control inside a Field takes the Field's wiring from context, so the Field's label names it and
 * its hint or error describes it. Switch rendered with no id, so the label's `for` pointed at
 * nothing.
 */
import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import FieldControl from './fixtures/FieldControl.svelte';

const html = (props: { control: 'switch' | 'radio-group'; hint?: string; error?: string }) =>
  render(FieldControl, { props }).body;

describe('Switch inside a Field', () => {
  it('takes the id the Field label points at', () => {
    const out = html({ control: 'switch' });
    expect(out).toContain('for="notify"');
    expect(out).toMatch(/<button[^>]*id="notify"/);
  });

  it('is described by the hint, and by the error instead when there is one', () => {
    expect(html({ control: 'switch', hint: 'Sent once' })).toMatch(
      /<button[^>]*aria-describedby="notify-hint"/
    );
    const withError = html({ control: 'switch', hint: 'Sent once', error: 'Required' });
    expect(withError).toMatch(/<button[^>]*aria-describedby="notify-error"/);
    expect(withError).toMatch(/<button[^>]*aria-invalid="true"/);
  });

  it('inherits required', () => {
    expect(html({ control: 'switch' })).toMatch(/<button[^>]*aria-required="true"/);
  });
});

describe('RadioGroup inside a Field', () => {
  it('is labelled by the Field label', () => {
    expect(html({ control: 'radio-group' })).toMatch(
      /role="radiogroup"[^>]*aria-labelledby="notify-label"|aria-labelledby="notify-label"[^>]*role="radiogroup"/
    );
  });
});
