/**
 * Copies the scaffold's chrome out of the template tree into this app.
 *
 * The harness this replaced kept its own hooks, root layout, app.d.ts and locale
 * plumbing, written by hand to mirror the scaffold's. Nothing compared the two, so every
 * change to the template silently obligated an edit here, and by the end the copy no
 * longer built. These files are therefore never edited here: they are gitignored, and
 * every `dev`, `build` and `check` regenerates them from `tools/create/templates/base/`.
 * Change the template, and the harness follows on its next run.
 *
 * The base template is the source rather than SuperPrototype because its hooks make no
 * database call, so the harness boots with no Supabase. The one thing the base chrome
 * expects and does not ship — the root load's dictionary and locale list — comes from
 * `src/routes/+layout.server.ts`, which builds it from the same canonical seed data
 * `sveltebuilder sync:supabase` writes into every project's seed.sql.
 *
 * See docs/DEV-KITCHEN.md, Requirement 1.
 */
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const APP = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE = path.resolve(APP, '../../tools/create/templates/base');

/** Template path → path in this app. Keep in step with this app's .gitignore. */
const CHROME = [
  'src/app.html',
  'src/app.css',
  'src/chrome.css',
  'src/app.d.ts',
  'src/hooks.server.ts',
  'src/routes/+layout.svelte',
  'src/routes/+error.svelte',
];

for (const file of CHROME) {
  const from = path.join(TEMPLATE, file);
  if (!existsSync(from)) {
    throw new Error(`dev-kitchen: the base template no longer has ${file}; update sync-chrome.mjs`);
  }
  const to = path.join(APP, file);
  mkdirSync(path.dirname(to), { recursive: true });
  copyFileSync(from, to);
}

// The chrome reads PUBLIC_DEFAULT_LOCALE through $env/static/public, which fails the
// build when the variable is undefined. It is the only variable the harness needs, and it
// is not a secret; .env files are gitignored repo-wide, so write one when none exists.
const env = path.join(APP, '.env');
if (!existsSync(env)) writeFileSync(env, 'PUBLIC_DEFAULT_LOCALE=en\n');
