import { describe, expect, it } from 'vitest';
import { unansweredDrizzleKitPrompt } from '../src/lib/drizzle-kit-prompt.ts';

describe('unansweredDrizzleKitPrompt', () => {
  it('finds the rename question drizzle-kit gave up on', () => {
    // As drizzle-kit 0.29 printed it over a 1.x project, cursor escapes included.
    const output = [
      "Reading config file '/project/.sveltebuilder/drizzle.config.ts'",
      '\u001b[?25l',
      'Is media_asset_license enum created or renamed from another enum?',
      '❯ + media_asset_license                     create enum',
      '  ~ media_license › media_asset_license     rename enum',
    ].join('\n');
    expect(unansweredDrizzleKitPrompt(output)).toBe(
      'Is media_asset_license enum created or renamed from another enum?',
    );
  });

  it('finds a column question', () => {
    expect(
      unansweredDrizzleKitPrompt('Is menu column in navigation_item table created or renamed from another column?'),
    ).toContain('navigation_item');
  });

  it('is null for a run that asked nothing', () => {
    const output = [
      "Reading config file '/project/.sveltebuilder/drizzle.config.ts'",
      '[✓] Your SQL migration file ➜ supabase/migrations/0000_strong_hemingway.sql 🚀',
    ].join('\n');
    expect(unansweredDrizzleKitPrompt(output)).toBeNull();
  });
});
