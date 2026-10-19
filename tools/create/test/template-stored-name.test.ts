import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { TEMPLATE_STORED_NAMES, restoreTemplateStoredNames } from '../src/template-stored-name.js';

/**
 * The templates are only as complete as the published tarball. npm drops some files by name
 * (`.gitignore`, `.npmrc`) without a word, which is how every scaffold of the 2.0 release
 * candidate came to have no .gitignore. scaffold:check cannot see it: it copies templates from
 * this directory, not from the package. Files Claude Code would load from this repository
 * (`CLAUDE.md`, `.claude/rules/`) are stored under other names for the same kind of reason.
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

  it('stores no template file under its real name', () => {
    const tracked = execFileSync('git', ['ls-files', 'templates'], {
      cwd: createRoot,
      encoding: 'utf8',
    })
      .split('\n')
      .filter(Boolean);
    const realNames = Object.values(TEMPLATE_STORED_NAMES).concat('.npmrc');
    const storedUnderRealName = (file: string) =>
      realNames.some((realName) => path.basename(file) === realName || file.includes(`/${realName}/`));
    expect(tracked.filter(storedUnderRealName)).toEqual([]);
  });
});

describe('restoreTemplateStoredNames', () => {
  let targetDir: string;

  beforeEach(() => {
    targetDir = fs.mkdtempSync(path.join(os.tmpdir(), 'template-stored-name-'));
  });

  afterEach(() => {
    fs.rmSync(targetDir, { recursive: true, force: true });
  });

  it('gives a copied gitignore its real name', async () => {
    fs.writeFileSync(path.join(targetDir, 'gitignore'), '.env\n');
    await restoreTemplateStoredNames(targetDir);
    expect(fs.existsSync(path.join(targetDir, 'gitignore'))).toBe(false);
    expect(fs.readFileSync(path.join(targetDir, '.gitignore'), 'utf8')).toBe('.env\n');
  });

  it('gives the Claude Code instructions their real names', async () => {
    fs.writeFileSync(path.join(targetDir, 'CLAUDE.template.md'), '# CLAUDE.md\n');
    fs.mkdirSync(path.join(targetDir, 'claude-rules'));
    fs.writeFileSync(path.join(targetDir, 'claude-rules', 'database.md'), '# Database\n');
    await restoreTemplateStoredNames(targetDir);
    expect(fs.readFileSync(path.join(targetDir, 'CLAUDE.md'), 'utf8')).toBe('# CLAUDE.md\n');
    expect(fs.readFileSync(path.join(targetDir, '.claude', 'rules', 'database.md'), 'utf8')).toBe(
      '# Database\n'
    );
    expect(fs.existsSync(path.join(targetDir, 'CLAUDE.template.md'))).toBe(false);
    expect(fs.existsSync(path.join(targetDir, 'claude-rules'))).toBe(false);
  });
});
