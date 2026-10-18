import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { addModuleStylesheet, copyModuleTemplate } from '../src/module-template.js';

/**
 * What a project receives from a module before any of its screens are chosen. Runs against a
 * small template tree written for the test, so it checks the copy rules rather than any one
 * module's contents.
 */

let root: string;
let templatesDir: string;
let targetDir: string;

const write = (file: string, content = '') => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
};

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'module-template-'));
  templatesDir = path.join(root, 'templates');
  targetDir = path.join(root, 'project');
  const moduleDir = path.join(templatesDir, 'modules', 'logistic');
  write(path.join(moduleDir, 'manifest.json'), '{}');
  write(path.join(moduleDir, 'seed', 'seed.sql'), '-- seed');
  write(path.join(moduleDir, 'supplemental', '05-logistic.sql'), '-- rls');
  write(path.join(moduleDir, 'server.superprototype', 'supplier.ts'), 'export {};');
  write(path.join(moduleDir, 'server.native', 'supplier.ts'), 'export {};');
  fs.mkdirSync(targetDir);
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

const exists = (relative: string) => fs.existsSync(path.join(targetDir, relative));

describe('copyModuleTemplate', () => {
  it("copies the flavour's data modules to src/lib/server/<module>/", async () => {
    await copyModuleTemplate({
      templatesDir,
      module: 'logistic',
      scaffoldTemplate: 'superprototype',
      targetDir,
    });

    expect(exists('src/lib/server/logistic/supplier.ts')).toBe(true);
  });

  it("copies no other flavour's data modules", async () => {
    await copyModuleTemplate({
      templatesDir,
      module: 'logistic',
      scaffoldTemplate: 'superprototype',
      targetDir,
    });

    // The superprototype file is there; nothing from server.native came along beside it.
    expect(fs.readdirSync(path.join(targetDir, 'src/lib/server/logistic'))).toEqual(['supplier.ts']);
    expect(exists('src/lib/server/native')).toBe(false);
  });

  it('copies the registry manifest, seed and supplemental SQL', async () => {
    await copyModuleTemplate({
      templatesDir,
      module: 'logistic',
      scaffoldTemplate: 'superprototype',
      targetDir,
    });

    expect(exists('.sveltebuilder/registry/@sveltebuilder-logistic.json')).toBe(true);
    expect(exists('supabase/seeds/logistic.sql')).toBe(true);
    expect(exists('supabase/supplemental/05-logistic.sql')).toBe(true);
  });

  it('skips the data modules when the flavour has none', async () => {
    await copyModuleTemplate({
      templatesDir,
      module: 'logistic',
      scaffoldTemplate: 'flavour-without-server',
      targetDir,
    });

    expect(exists('src/lib/server/logistic')).toBe(false);
  });
});

describe('addModuleStylesheet', () => {
  const APP_CSS = [
    '@layer reset, tokens, base, chrome, components, utilities;',
    '',
    "@import '@sveltebuilder/coreui/styles/components.css' layer(components);",
    "/* Each domain module's stylesheet, in the same layer after coreui's: create-sveltebuilder adds",
    '   one line per module selected. */',
    '',
    ':root {}',
    '',
  ].join('\n');

  const appCss = () => fs.readFileSync(path.join(targetDir, 'src', 'app.css'), 'utf8');

  beforeEach(() => write(path.join(targetDir, 'src', 'app.css'), APP_CSS));

  it("imports the module's stylesheet into the components layer after coreui's comment", async () => {
    await addModuleStylesheet(targetDir, 'content');

    expect(appCss().split('\n').slice(2, 6)).toEqual([
      "@import '@sveltebuilder/coreui/styles/components.css' layer(components);",
      "/* Each domain module's stylesheet, in the same layer after coreui's: create-sveltebuilder adds",
      '   one line per module selected. */',
      "@import '@sveltebuilder/content/styles/components.css' layer(components);",
    ]);
  });

  it('adds each module after the ones already there, once', async () => {
    await addModuleStylesheet(targetDir, 'content');
    await addModuleStylesheet(targetDir, 'logistic');
    await addModuleStylesheet(targetDir, 'content');

    const imports = appCss()
      .split('\n')
      .filter((line) => line.startsWith("@import '@sveltebuilder/"));
    expect(imports).toEqual([
      "@import '@sveltebuilder/coreui/styles/components.css' layer(components);",
      "@import '@sveltebuilder/content/styles/components.css' layer(components);",
      "@import '@sveltebuilder/logistic/styles/components.css' layer(components);",
    ]);
  });

  it("goes after the comment even when an always-present package's line sits beside coreui's", async () => {
    write(
      path.join(targetDir, 'src', 'app.css'),
      APP_CSS.replace(
        "layer(components);\n/*",
        "layer(components);\n@import '@sveltebuilder/access/styles/components.css' layer(components);\n/*"
      )
    );
    await addModuleStylesheet(targetDir, 'content');

    expect(appCss().split('\n').slice(2, 7)).toEqual([
      "@import '@sveltebuilder/coreui/styles/components.css' layer(components);",
      "@import '@sveltebuilder/access/styles/components.css' layer(components);",
      "/* Each domain module's stylesheet, in the same layer after coreui's: create-sveltebuilder adds",
      '   one line per module selected. */',
      "@import '@sveltebuilder/content/styles/components.css' layer(components);",
    ]);
  });

  it("refuses an app.css that does not import coreui's stylesheet", async () => {
    write(path.join(targetDir, 'src', 'app.css'), ':root {}\n');
    await expect(addModuleStylesheet(targetDir, 'content')).rejects.toThrow(/coreui/);
  });
});
