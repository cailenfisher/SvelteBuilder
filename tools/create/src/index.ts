#!/usr/bin/env node
import * as p from '@clack/prompts';
import pc from 'picocolors';
import fs from 'fs-extra';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { sync } from '@sveltebuilder/cli/api';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMPLATES_DIR = path.resolve(__dirname, '..', 'templates');

type PackageManager = 'pnpm' | 'npm' | 'yarn';

const MODULE_DEPS: Record<string, string[]> = {
  blog: ['@sveltebuilder/blog', '@sveltebuilder/coreui'],
};

function validateProjectName(value: string): string | undefined {
  if (!value.trim()) return 'Project name is required.';
  if (!/^[a-z0-9][a-z0-9-_.]*$/.test(value))
    return 'Use lowercase letters, numbers, hyphens, underscores, or dots.';
  if (value.length > 214) return 'Name too long (max 214 characters).';
}

async function main() {
  const args = process.argv.slice(2);
  const noInstall = args.includes('--no-install');
  const argName = args.find((a) => !a.startsWith('-'));
  const validArg = argName ? argName : undefined;

  console.log('');
  p.intro(pc.bgCyan(pc.black(' create-sveltebuilder ')));

  // ── Project name ──────────────────────────────────────────────────────────
  let projectName: string;
  if (validArg) {
    const err = validateProjectName(validArg);
    if (err) {
      p.cancel(`Invalid project name: ${err}`);
      process.exit(1);
    }
    projectName = validArg;
    p.log.step(`Project name: ${pc.cyan(projectName)}`);
  } else {
    const name = await p.text({
      message: 'Project name',
      placeholder: 'my-sveltebuilder-app',
      validate: validateProjectName,
    });
    if (p.isCancel(name)) {
      p.cancel('Cancelled.');
      process.exit(0);
    }
    projectName = name as string;
  }

  // ── Package manager ───────────────────────────────────────────────────────
  const pm = await p.select({
    message: 'Package manager',
    options: [
      { value: 'pnpm' as PackageManager, label: 'pnpm' },
      { value: 'npm' as PackageManager, label: 'npm' },
      { value: 'yarn' as PackageManager, label: 'yarn' },
    ],
  });
  if (p.isCancel(pm)) {
    p.cancel('Cancelled.');
    process.exit(0);
  }

  // ── Module selection ──────────────────────────────────────────────────────
  const selectedModules = await p.multiselect({
    message: 'Select domain modules to include',
    options: [
      {
        value: 'blog',
        label: 'Blog',
        hint: 'Posts, categories, tags, comments, RSS, sitemap',
      },
    ],
    required: false,
  });
  if (p.isCancel(selectedModules)) {
    p.cancel('Cancelled.');
    process.exit(0);
  }

  const modules = selectedModules as string[];
  const targetDir = path.resolve(process.cwd(), projectName);

  // ── Overwrite check ───────────────────────────────────────────────────────
  if (await fs.pathExists(targetDir)) {
    const entries = await fs.readdir(targetDir);
    if (entries.length > 0) {
      const overwrite = await p.confirm({
        message: `"${projectName}" already exists and is not empty. Overwrite?`,
        initialValue: false,
      });
      if (p.isCancel(overwrite) || !overwrite) {
        p.cancel('Cancelled.');
        process.exit(0);
      }
      await fs.emptyDir(targetDir);
    }
  }

  const s = p.spinner();

  // ── Step 1: Scaffold base template ────────────────────────────────────────
  s.start('Scaffolding project...');
  await fs.copy(path.join(TEMPLATES_DIR, 'base'), targetDir, { overwrite: true });

  // Rename package.json "name" to the project name.
  const pkgPath = path.join(targetDir, 'package.json');
  const pkg = await fs.readJson(pkgPath) as Record<string, unknown> & {
    dependencies: Record<string, string>;
  };
  pkg.name = projectName;

  // ── Step 2–3: Copy module templates ──────────────────────────────────────
  for (const mod of modules) {
    const modDir = path.join(TEMPLATES_DIR, 'modules', mod);

    const routesDir = path.join(modDir, 'routes');
    if (await fs.pathExists(routesDir)) {
      await fs.copy(routesDir, path.join(targetDir, 'src', 'routes'), { overwrite: true });
    }

    const schemasDir = path.join(modDir, 'schemas');
    if (await fs.pathExists(schemasDir)) {
      await fs.copy(schemasDir, path.join(targetDir, 'supabase', 'schemas'), {
        overwrite: true,
      });
    }

    const manifestSrc = path.join(modDir, 'manifest.json');
    if (await fs.pathExists(manifestSrc)) {
      const manifestDest = path.join(
        targetDir,
        'supabase',
        'schemas',
        '_registry',
        `@sveltebuilder-${mod}.json`,
      );
      await fs.copy(manifestSrc, manifestDest, { overwrite: true });
    }
  }

  // ── Step 4: Write updated package.json with module deps ───────────────────
  if (modules.length > 0) {
    const moduleDeps = [...new Set(modules.flatMap((m) => MODULE_DEPS[m] ?? []))];
    for (const dep of moduleDeps) {
      pkg.dependencies[dep] = 'latest';
    }
  }
  await fs.writeJson(pkgPath, pkg, { spaces: 2 });

  s.stop('Project scaffolded');

  // ── Step 5: sveltebuilder sync ────────────────────────────────────────────
  s.start('Resolving schema order...');
  try {
    await sync(targetDir);
    s.stop('Schema order resolved');
  } catch (err) {
    s.stop(pc.yellow('Schema sync skipped (run `sveltebuilder sync` after setup)'));
    if (err instanceof Error) p.log.warn(err.message);
  }

  // ── Step 6: Install dependencies ─────────────────────────────────────────
  if (noInstall) {
    p.log.info('Skipping install (--no-install).');
  } else {
    s.start(`Installing dependencies with ${pm}...`);
    const installResult = spawnSync(pm as string, ['install'], {
      cwd: targetDir,
      stdio: 'pipe',
      shell: process.platform === 'win32',
    });
    if (installResult.status !== 0) {
      s.stop(pc.yellow('Install failed'));
      p.log.warn(
        `Run \`${pm} install\` inside ${pc.cyan(projectName)} once dependencies are available.`,
      );
      if (installResult.stderr) p.log.warn(installResult.stderr.toString().trim());
    } else {
      s.stop('Dependencies installed');
    }
  }

  // ── Done ──────────────────────────────────────────────────────────────────
  const runCmd = pm === 'npm' ? 'npm run dev' : `${pm} dev`;
  const nextSteps = [
    `${pc.green('✓')} ${pc.cyan(projectName)} is ready!`,
    '',
    `  ${pc.dim('cd')} ${pc.cyan(projectName)}`,
    `  ${pc.dim('cp')} .env.example .env   ${pc.dim('# add your Supabase credentials')}`,
  ];
  if (noInstall) {
    nextSteps.push(`  ${pc.dim(pm + ' install')}   ${pc.dim('# install deps when packages are published')}`);
  }
  nextSteps.push(`  ${pc.dim(runCmd)}`);
  p.outro(nextSteps.join('\n'));
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(pc.red(`\nError: ${message}`));
  process.exit(1);
});
