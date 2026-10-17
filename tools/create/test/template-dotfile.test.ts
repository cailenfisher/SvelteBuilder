import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { TEMPLATE_DOTFILES, restoreTemplateDotfiles } from '../src/template-dotfile.js';

/**
 * The templates are only as complete as the published tarball. npm drops some files by name
 * (`.gitignore`, `.npmrc`) without a word, which is how every scaffold of the 2.0 release
 * candidate came to have no .gitignore. scaffold:check cannot see it: it copies templates from
 * this directory, not from the package.
 */

const createRoot = path.resolve(__dirname, '..');

describe('the published package', () => {
  it('contains every file under templates/', () => {
    const packed = JSON.parse(
      execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], {
        cwd: createRoot,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      })
    ) as { files: { path: string }[] }[];
    const packedPaths = new Set(packed[0]?.files.map((file) => file.path));

    const tracked = execFileSync('git', ['ls-files', 'templates'], {
      cwd: createRoot,
      encoding: 'utf8',
    })
      .split('\n')
      .filter(Boolean);

    expect(tracked.length).toBeGreaterThan(0);
    expect(tracked.filter((file) => !packedPaths.has(file))).toEqual([]);
  });

  it('stores no template file under a name npm refuses to publish', () => {
    const tracked = execFileSync('git', ['ls-files', 'templates'], {
      cwd: createRoot,
      encoding: 'utf8',
    }).split('\n');
    const refused = Object.values(TEMPLATE_DOTFILES).concat('.npmrc');
    expect(tracked.filter((file) => refused.includes(path.basename(file)))).toEqual([]);
  });
});

describe('restoreTemplateDotfiles', () => {
  let targetDir: string;

  beforeEach(() => {
    targetDir = fs.mkdtempSync(path.join(os.tmpdir(), 'template-dotfile-'));
  });

  afterEach(() => {
    fs.rmSync(targetDir, { recursive: true, force: true });
  });

  it('gives a copied gitignore its real name', async () => {
    fs.writeFileSync(path.join(targetDir, 'gitignore'), '.env\n');
    await restoreTemplateDotfiles(targetDir);
    expect(fs.existsSync(path.join(targetDir, 'gitignore'))).toBe(false);
    expect(fs.readFileSync(path.join(targetDir, '.gitignore'), 'utf8')).toBe('.env\n');
  });
});
