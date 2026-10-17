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
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const APP = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE = path.resolve(APP, '../../tools/create/templates/base');

/** Template path → path in this app. Keep in step with this app's .gitignore. */
const CHROME = [
  'src/app.html',
  'src/app.css',
  'src/chrome.css',
  'src/utilities.css',
  'src/app.d.ts',
  'src/hooks.server.ts',
  'src/routes/+layout.svelte',
  'src/routes/app-layout.css',
  'src/routes/full-page-layout.css',
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

// The harness renders every module, so its app.css imports every module's stylesheet, as
// create-sveltebuilder's addModuleStylesheet does for the modules a project selects.
const COREUI_STYLESHEET = "@import '@sveltebuilder/coreui/styles/components.css' layer(components);";
const MODULE_STYLESHEETS = ['content', 'logistic'].map(
  (module) => `@import '@sveltebuilder/${module}/styles/components.css' layer(components);`
);
const appCssPath = path.join(APP, 'src/app.css');
const appCss = readFileSync(appCssPath, 'utf8').split('\n');
const coreui = appCss.indexOf(COREUI_STYLESHEET);
if (coreui === -1) {
  throw new Error("dev-kitchen: the base template's app.css no longer imports coreui's stylesheet");
}
let insertAt = coreui;
if (appCss[coreui + 1]?.startsWith('/*')) {
  while (!appCss[insertAt].includes('*/')) insertAt += 1;
}
appCss.splice(insertAt + 1, 0, ...MODULE_STYLESHEETS);
writeFileSync(appCssPath, appCss.join('\n'));

// The chrome reads PUBLIC_DEFAULT_LOCALE through $env/static/public, which fails the
// build when the variable is undefined. It is the only variable the harness needs, and it
// is not a secret; .env files are gitignored repo-wide, so write one when none exists.
const env = path.join(APP, '.env');
if (!existsSync(env)) writeFileSync(env, 'PUBLIC_DEFAULT_LOCALE=en\n');
