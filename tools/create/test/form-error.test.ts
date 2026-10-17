import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { DictionaryInstance } from 'diglossia';
import type { formErrorText as FormErrorText } from '../templates/base/src/lib/FormError/form-error.js';

/**
 * How a screen shows a form action's error. The helper's imports are type-only, so it runs here
 * against a stand-in dictionary holding exactly the copy each case names. It is loaded from a
 * copy, because the template's own tsconfig extends one only a scaffolded project generates.
 */

const SOURCE = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../templates/base/src/lib/FormError/form-error.ts'
);
let formErrorText: typeof FormErrorText;

beforeAll(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'form-error-'));
  const copy = path.join(dir, 'form-error.ts');
  fs.copyFileSync(SOURCE, copy);
  ({ formErrorText } = await import(/* @vite-ignore */ copy));
});

type Row = [slug: string, scope: string | null, text: string];

function dictionaryOf(rows: Row[]): DictionaryInstance {
  const find = (slug: string, scope?: string | null) =>
    rows.find((row) => row[0] === slug && row[1] === (scope ?? null));
  return {
    localeOf: (slug: string, scope?: string | null) => (find(slug, scope) ? 'fr' : undefined),
    localText: (slug: string, scope?: string | null) => find(slug, scope)?.[2] ?? `[missing: ${slug}]`,
  } as unknown as DictionaryInstance;
}

const global = dictionaryOf([
  ['feedback.error', null, 'Une erreur est survenue'],
  ['error.id_invalid', null, 'Identifiant non valide.'],
]);

afterEach(() => vi.restoreAllMocks());

describe('formErrorText', () => {
  it("shows a module's error from the screen dictionary, in the module's scope", () => {
    const screen = dictionaryOf([['logistic.error.sku_required', 'logistic', 'Le SKU est obligatoire.']]);
    expect(formErrorText({ slug: 'logistic.error.sku_required' }, screen, global)).toBe(
      'Le SKU est obligatoire.'
    );
  });

  it("shows the base template's errors from the global dictionary", () => {
    expect(formErrorText({ slug: 'error.id_invalid' }, global, global)).toBe('Identifiant non valide.');
  });

  it('falls back to "Something went wrong" in the reader\'s language, and logs the slug', () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const screen = dictionaryOf([]);
    expect(formErrorText({ slug: 'logistic.error.sku_required' }, screen, global)).toBe(
      'Une erreur est survenue'
    );
    expect(log).toHaveBeenCalledWith(expect.stringContaining('logistic.error.sku_required'));
  });

  it('never shows a [missing:] sentinel', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const text = formErrorText({ slug: 'content.error.nonexistent' }, dictionaryOf([]), global);
    expect(text).not.toContain('[missing:');
  });
});
