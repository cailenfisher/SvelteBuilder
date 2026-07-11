#!/usr/bin/env node
import * as p from '@clack/prompts';
import pc from 'picocolors';
import fs from 'fs-extra';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { syncSupabase } from '@sveltebuilder/cli/api';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMPLATES_DIR = path.resolve(__dirname, '..', 'templates');

type PackageManager = 'pnpm' | 'npm' | 'yarn';
type ScaffoldTemplate = 'superprototype' | 'native';

const MODULE_DEPS: Record<string, string[]> = {
  content: ['@sveltebuilder/content', '@sveltebuilder/coreui'],
  logistic: ['@sveltebuilder/logistic', '@sveltebuilder/coreui'],
};

function validateProjectName(value: string): string | undefined {
  if (!value.trim()) return 'Project name is required.';
  if (!/^[a-z0-9][a-z0-9-_.]*$/.test(value))
    return 'Use lowercase letters, numbers, hyphens, underscores, or dots.';
  if (value.length > 214) return 'Name too long (max 214 characters).';
}

async function deepMergePackageJson(
  base: Record<string, unknown> & { dependencies: Record<string, string> },
  overlay: { dependencies?: Record<string, string>; devDependencies?: Record<string, string> }
): Promise<void> {
  if (overlay.dependencies) {
    base.dependencies = { ...base.dependencies, ...overlay.dependencies };
  }
  if (overlay.devDependencies) {
    base.devDependencies = {
      ...(base.devDependencies as Record<string, string> ?? {}),
      ...overlay.devDependencies,
    };
  }
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

  // ── Scaffold template ─────────────────────────────────────────────────────
  const templateChoice = await p.select({
    message: 'Scaffold template',
    options: [
      {
        value: 'superprototype' as ScaffoldTemplate,
        label: 'SuperPrototype',
        hint: 'Supabase Auth + Supabase Postgres, ready to deploy',
      },
      {
        value: 'native' as ScaffoldTemplate,
        label: 'Native',
        hint: 'coming soon',
      },
    ],
  });
  if (p.isCancel(templateChoice)) {
    p.cancel('Cancelled.');
    process.exit(0);
  }
  if (templateChoice === 'native') {
    p.cancel('The Native template is not yet available. Select SuperPrototype to continue.');
    process.exit(0);
  }
  const scaffoldTemplate = templateChoice as ScaffoldTemplate;

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
        value: 'content',
        label: 'Content',
        hint: 'Publisher/news: articles, sections, taxonomy, live coverage, newsletter, RSS, sitemap',
      },
      {
        value: 'logistic',
        label: 'Logistic',
        hint: 'Warehouse: receiving, pick tasks, shipments, returns, cycle counts',
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

  // Read base package.json before overlaying the scaffold template.
  const pkgPath = path.join(targetDir, 'package.json');
  const pkg = await fs.readJson(pkgPath) as Record<string, unknown> & {
    dependencies: Record<string, string>;
  };
  pkg.name = projectName;

  // ── Step 2: Overlay scaffold template ────────────────────────────────────
  const templateDir = path.join(TEMPLATES_DIR, scaffoldTemplate);
  if (await fs.pathExists(templateDir)) {
    // Copy template files on top of base. Exclude package.json (merged below)
    // and monorepo-only reference docs (*.superprototype.md, etc.).
    await fs.copy(templateDir, targetDir, {
      overwrite: true,
      filter: (src) => {
        const basename = path.basename(src);
        if (basename === 'package.json') return false;
        if (/\.(superprototype|native)\.md$/.test(basename)) return false;
        return true;
      },
    });

    // Deep-merge scaffold template's package.json deps into base.
    const templatePkgPath = path.join(templateDir, 'package.json');
    if (await fs.pathExists(templatePkgPath)) {
      const templatePkg = await fs.readJson(templatePkgPath) as {
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
      };
      await deepMergePackageJson(pkg, templatePkg);
    }
  }

  // ── Step 3: Copy module templates ─────────────────────────────────────────
  for (const mod of modules) {
    const modDir = path.join(TEMPLATES_DIR, 'modules', mod);

    const routesDir = path.join(modDir, 'routes');
    if (await fs.pathExists(routesDir)) {
      await fs.copy(routesDir, path.join(targetDir, 'src', 'routes'), { overwrite: true });
    }

    // Copy module supplemental SQL (RLS, triggers, cross-FK constraints) to supabase/supplemental/
    const supplementalDir = path.join(modDir, 'supplemental');
    if (await fs.pathExists(supplementalDir)) {
      await fs.copy(supplementalDir, path.join(targetDir, 'supabase', 'supplemental'), {
        overwrite: true,
      });
    }

    // Copy module manifest to .sveltebuilder/registry/
    const manifestSrc = path.join(modDir, 'manifest.json');
    if (await fs.pathExists(manifestSrc)) {
      const manifestDest = path.join(
        targetDir,
        '.sveltebuilder',
        'registry',
        `@sveltebuilder-${mod}.json`,
      );
      await fs.copy(manifestSrc, manifestDest, { overwrite: true });
    }

    // Copy module seed SQL to supabase/seeds/<mod>.sql
    // sync:supabase will append these to the generated seed.sql
    const modSeedPath = path.join(modDir, 'seed', 'seed.sql');
    if (await fs.pathExists(modSeedPath)) {
      const seedDestDir = path.join(targetDir, 'supabase', 'seeds');
      await fs.ensureDir(seedDestDir);
      await fs.copy(modSeedPath, path.join(seedDestDir, `${mod}.sql`), { overwrite: true });
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

  // ── Step 5: Install dependencies ─────────────────────────────────────────
  // Must run before sync:supabase since drizzle-kit is installed as a dev dep.
  if (noInstall) {
    p.log.info('Skipping install (--no-install). Run `sveltebuilder sync:supabase` manually after installing.');
  } else {
    s.start(`Installing dependencies with ${pm}...`);
    const installResult = await new Promise<{ status: number; stderr: string }>((resolve) => {
      const child = spawn(pm as string, ['install'], {
        cwd: targetDir,
        stdio: 'pipe',
        shell: process.platform === 'win32',
      });
      let stderr = '';
      child.stderr?.on('data', (chunk: Buffer) => { stderr += chunk; });
      child.on('close', (code) => resolve({ status: code ?? 1, stderr }));
    });
    if (installResult.status !== 0) {
      s.stop(pc.yellow('Install failed'));
      p.log.warn(
        `Run \`${pm} install\` inside ${pc.cyan(projectName)} once dependencies are available.`,
      );
      if (installResult.stderr) p.log.warn(installResult.stderr.trim());
    } else {
      s.stop('Dependencies installed');
    }
  }

  // ── Step 6: sveltebuilder sync:supabase ───────────────────────────────────
  if (!noInstall) {
    s.start('Generating Supabase migrations...');
    try {
      await syncSupabase(targetDir);
      s.stop('Supabase migrations generated');
    } catch (err) {
      s.stop(pc.yellow('Migration generation skipped — run `sveltebuilder sync:supabase` manually'));
      if (err instanceof Error) p.log.warn(err.message);
    }
  }

  // ── Done ──────────────────────────────────────────────────────────────────
  const runCmd = pm === 'npm' ? 'npm run dev' : `${pm} dev`;
  const nextSteps = [
    `${pc.green('✓')} ${pc.cyan(projectName)} is ready!`,
    '',
    `  ${pc.dim('cd')} ${pc.cyan(projectName)}`,
  ];
  if (scaffoldTemplate === 'superprototype') {
    nextSteps.push(`  ${pc.dim('cp')} .env.example .env   ${pc.dim('# add your Supabase credentials')}`);
    nextSteps.push(`  ${pc.dim('sveltebuilder sync:supabase')}`);
    nextSteps.push(`  ${pc.dim('supabase link --project-ref <project-ref>')}`);
    nextSteps.push(`  ${pc.dim('supabase db push')}`);
    nextSteps.push(`  ${pc.dim('# seed your database')}`);
  }
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
