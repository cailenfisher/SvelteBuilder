/**
 * A control inside a Field takes the Field's wiring from context, so the Field's label names it and
 * its hint or error describes it. Switch rendered with no id, so the label's `for` pointed at
 * nothing.
 */
import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import FieldWithControl from './fixtures/FieldWithControl.svelte';

type Fixture = {
  control: 'switch' | 'radio-group' | 'input' | 'custom';
  hint?: string;
  error?: string;
  controlError?: boolean;
  disabled?: boolean;
};

const html = (props: Fixture) => render(FieldWithControl, { props }).body;

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

describe('Input inside a Field', () => {
  it('is described by the hint', () => {
    expect(html({ control: 'input', hint: 'Sent once' })).toMatch(
      /<input[^>]*aria-describedby="notify-hint"/
    );
  });

  it("is invalid by its own error, but never described by an error the Field did not render", () => {
    const out = html({ control: 'input', hint: 'Sent once', controlError: true });
    expect(out).toMatch(/<input[^>]*aria-invalid="true"/);
    expect(out).not.toContain('notify-error');
    expect(out).toMatch(/<input[^>]*aria-describedby="notify-hint"/);
  });
});

describe('a custom control spreading useField()', () => {
  it('gets the id, description, invalid state, required and disabled under their HTML names', () => {
    const out = html({ control: 'custom', error: 'Required', disabled: true });
    const input = out.match(/<input class="custom-field-control"[^>]*>/)?.[0] ?? '';
    expect(input).toContain('id="notify"');
    expect(input).toContain('aria-describedby="notify-error"');
    expect(input).toContain('aria-invalid="true"');
    expect(input).toContain('required');
    expect(input).toContain('disabled');
  });

  it('is described by nothing when the Field has neither hint nor error', () => {
    const input = html({ control: 'custom' }).match(/<input class="custom-field-control"[^>]*>/)?.[0] ?? '';
    expect(input).not.toContain('aria-describedby');
    expect(input).not.toContain('aria-invalid');
  });
});
