#!/usr/bin/env node
/**
 * Holds the stylesheet rules in .claude/rules/css.md ("Plain stylesheets") that nothing else checks.
 *
 * Components carry no `<style>` blocks: every style is a plain CSS file, scoped by its BEM class
 * names rather than by Svelte's compiler. That trades away two things the compiler did for free,
 * and this script puts them back:
 *
 * - **Scoping.** A selector in a `<style>` block only ever matched the component's own elements.
 *   In a plain stylesheet it matches the whole app, so every selector must name a class of the
 *   stylesheet's own block, and every element it reaches beneath that class must be named by a
 *   class too. A bare `p` under `.article-card__dek` would otherwise also hit the paragraphs of
 *   every child component.
 * - **Unused-selector warnings.** svelte-check reported a rule no element matched. This reports
 *   a class no source file mentions.
 *
 * It also fails on any `<style>` block or `:global`, on a stylesheet nothing imports, and on a
 * class two stylesheets both claim.
 *
 * A stylesheet's block is its file name: `Table/table.css` owns `.table`, `.table-row`,
 * `.table-cell`; a screen's `stock-level-admin.css` owns `.stock-level-admin`.
 *
 *   node scripts/css-check.mjs
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

/** Files git knows or would add: dev-kitchen's chrome is generated from the base template and ignored. */
const tracked = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { cwd: ROOT, encoding: 'utf8' })
  .split('\n')
  .filter((file) => file && existsSync(path.join(ROOT, file)));

/** Where the rules apply. The Native template is on hold and not maintained (CLAUDE.md). */
const TREES = [
  /^packages\/[^/]+\/src\//,
  /^tools\/create\/templates\/(base|superprototype|modules)\//,
  /^apps\/dev-kitchen\/src\//,
];

/**
 * Stylesheets that are not one block's: the design tokens and base layer, the scaffold's
 * layered chrome, which styles element classes on purpose, and the files that only import
 * others.
 */
const NOT_A_BLOCK = [
  /^packages\/coreui\/styles\//,
  /\/src\/app\.css$/,
  /\/src\/chrome\.css$/,
  /\/src\/utilities\.css$/,
  /^packages\/[^/]+\/src\/lib\/components\.css$/,
];

const inTrees = (file) => TREES.some((tree) => tree.test(file));
const files = tracked.filter(inTrees);
const svelteFiles = files.filter((file) => file.endsWith('.svelte'));
const stylesheets = files.filter((file) => file.endsWith('.css'));
const sourceFiles = files.filter((file) => /\.(svelte|ts|js)$/.test(file));
const read = (file) => readFileSync(path.join(ROOT, file), 'utf8');

const failures = [];
const fail = (file, message) => failures.push(`${file}: ${message}`);

// ── No <style> blocks, no :global ────────────────────────────────────────────

for (const file of svelteFiles) {
  if (/<style[\s>]/.test(read(file))) fail(file, 'has a <style> block; move it to a stylesheet');
}
for (const file of [...svelteFiles, ...stylesheets]) {
  if (read(file).includes(':global')) fail(file, 'uses :global');
}

// ── Parsing ──────────────────────────────────────────────────────────────────

/** Every style rule's selector list, skipping at-rule preludes and keyframe steps. */
function selectorLists(css) {
  const text = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const lists = [];
  const stack = []; // 'rule' | 'group' | 'keyframes' | 'declarations'
  let buffer = '';
  for (const character of text) {
    if (character === '{') {
      const prelude = buffer.trim();
      buffer = '';
      if (prelude.startsWith('@')) {
        stack.push(/^@(-\w+-)?keyframes/.test(prelude) ? 'keyframes' : 'group');
      } else if (stack.at(-1) === 'keyframes' || stack.at(-1) === 'rule') {
        stack.push('declarations');
      } else {
        lists.push(prelude);
        stack.push('rule');
      }
    } else if (character === '}') {
      stack.pop();
      buffer = '';
    } else if (character === ';' && (stack.length === 0 || stack.at(-1) === 'group')) {
      buffer = ''; // @import, @layer statements
    } else {
      buffer += character;
    }
  }
  return lists;
}

/** Splits on a separator that is not inside brackets or parentheses. */
function splitTopLevel(text, separator) {
  const parts = [];
  let depth = 0;
  let current = '';
  for (const character of text) {
    if (character === '(' || character === '[') depth += 1;
    if (character === ')' || character === ']') depth -= 1;
    if (depth === 0 && separator.test(character)) {
      parts.push(current);
      current = '';
    } else {
      current += character;
    }
  }
  parts.push(current);
  return parts.map((part) => part.trim()).filter(Boolean);
}

/** Compound selectors, left to right. */
const compounds = (selector) =>
  splitTopLevel(selector.replace(/\s*([>+~])\s*/g, ' '), /\s/);

/** Class names in a compound, ignoring those inside :not(), :is() and friends. */
const classesOf = (compound) =>
  [...compound.replace(/\([^)]*\)/g, '').matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map(
    (match) => match[1]
  );

// ── Every selector names its own block ───────────────────────────────────────

const blockOf = (file) => path.basename(file, '.css');
const belongsTo = (block, className) =>
  className === block || className.startsWith(`${block}-`) || className.startsWith(`${block}__`);

/** class → the stylesheets that define it as their own. */
const owners = new Map();

for (const file of stylesheets) {
  if (NOT_A_BLOCK.some((pattern) => pattern.test(file))) continue;
  const block = blockOf(file);

  for (const list of selectorLists(read(file))) {
    for (const selector of splitTopLevel(list, /,/)) {
      const parts = compounds(selector);
      const first = parts.findIndex((part) => classesOf(part).some((c) => belongsTo(block, c)));
      if (first === -1) {
        fail(file, `selector "${selector}" names no class of the ${block} block`);
        continue;
      }
      for (const part of parts.slice(first + 1)) {
        if (classesOf(part).length === 0 && !/^::?[\w-]+/.test(part)) {
          fail(file, `selector "${selector}" reaches "${part}" without naming it by a class`);
        }
      }
      for (const part of parts) {
        for (const className of classesOf(part)) {
          if (!belongsTo(block, className)) continue;
          if (!owners.has(className)) owners.set(className, new Set());
          owners.get(className).add(file);
        }
      }
    }
  }
}

/**
 * A SuperPrototype file overlays the base template's at the same path when a project is
 * scaffolded, so the two are one stylesheet in any project and may claim the same classes.
 */
const scaffoldPath = (file) =>
  file.replace(/^tools\/create\/templates\/(base|superprototype)\//, 'scaffold/');

for (const [className, files] of owners) {
  if (new Set([...files].map(scaffoldPath)).size > 1) {
    fail([...files].join(', '), `.${className} is claimed by more than one stylesheet`);
  }
}

// ── Every class is used ──────────────────────────────────────────────────────

/** The source a stylesheet's classes may be used from: its package, or the template tree. */
function scopeOf(file) {
  const packageMatch = file.match(/^packages\/[^/]+\//);
  if (packageMatch) return packageMatch[0];
  if (file.startsWith('tools/create/templates/')) return 'tools/create/templates/';
  return 'apps/dev-kitchen/src/';
}

const sourceByScope = new Map();
const sourceIn = (scope) => {
  if (!sourceByScope.has(scope)) {
    sourceByScope.set(
      scope,
      sourceFiles
        .filter((file) => file.startsWith(scope))
        .map(read)
        .join('\n')
    );
  }
  return sourceByScope.get(scope);
};

for (const [className, files] of owners) {
  const [file] = files;
  const source = sourceIn(scopeOf(file));
  // A class is used if it is written out, or if its stem is completed by an interpolation:
  // `button--${variant}` in script, or `button--{variant}` in markup, uses every
  // `.button--…` modifier.
  const cut = Math.max(className.lastIndexOf('--'), className.lastIndexOf('__'));
  const stem = cut > 0 ? className.slice(0, cut + 2) : null;
  const used =
    new RegExp(`(^|[^\\w-])${className}($|[^\\w-])`).test(source) ||
    (stem !== null && (source.includes(`${stem}\${`) || source.includes(`${stem}{`)));
  if (!used) fail(file, `.${className} is not used by any component or route`);
}

// ── Every stylesheet is imported ─────────────────────────────────────────────

for (const file of stylesheets) {
  if (NOT_A_BLOCK.some((pattern) => pattern.test(file))) continue;
  const directory = path.dirname(file);
  const name = path.basename(file);
  const packageIndex = file.match(/^(packages\/[^/]+\/src\/lib)\//);

  const importers = packageIndex
    ? [`${packageIndex[1]}/components.css`]
    : tracked.filter((other) => path.dirname(other) === directory && /\.(svelte|ts|js)$/.test(other));

  const imported = importers.some((importer) => {
    const text = read(importer);
    const relative = path.relative(path.dirname(importer), file);
    return text.includes(`'./${relative}'`) || text.includes(`'./${name}'`);
  });
  if (!imported) fail(file, 'is not imported by anything');
}

// ── Report ───────────────────────────────────────────────────────────────────

if (failures.length > 0) {
  console.error(failures.map((failure) => `✗ ${failure}`).join('\n'));
  console.error(`\ncss-check: ${failures.length} problem(s). The rules are in .claude/rules/css.md, "Plain stylesheets".`);
  process.exit(1);
}
console.log(`css-check: ${stylesheets.length} stylesheets, ${svelteFiles.length} components, no problems.`);
