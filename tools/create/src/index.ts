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

/**
 * The modules offered at the prompt. A module is always installable: it ships a
 * schema, components and supplemental SQL, none of which depend on any of its screens
 * being scaffolded. What varies is how many screen bundles it has been ported to, and
 * the prompt reports that from the template tree rather than from a hardcoded flag —
 * so a module becomes more capable as bundles land, with nothing here to update.
 */
const MODULE_CATALOG: Array<{ id: string; label: string; blurb: string }> = [
  {
    id: 'content',
    label: 'Content',
    blurb: 'Publisher/news: articles, sections, taxonomy, live coverage, newsletter, RSS, sitemap',
  },
  {
    id: 'logistic',
    label: 'Logistic',
    blurb: 'Warehouse: receiving, pick tasks, shipments, returns, cycle counts',
  },
];

const MODULE_DEPS: Record<string, string[]> = {
  content: ['@sveltebuilder/content', '@sveltebuilder/coreui'],
  logistic: ['@sveltebuilder/logistic', '@sveltebuilder/coreui'],
};

/**
 * One selectable screen bundle, as declared by
 * templates/modules/<module>/screens/<id>/manifest.json.
 *
 * A bundle is a coherent feature — its list, its detail, and any layout they share —
 * not a single route file. Selecting individual routes would leave the cross-links
 * screens make between each other pointing at pages that were never scaffolded, which
 * is what `requires` exists to prevent.
 */
type ScreenManifest = {
  id: string;
  module: string;
  label: string;
  hint?: string;
  routes?: string[];
  requires?: string[];
};

/** A bundle's key in the prompt. Screen ids only have to be unique per module. */
const screenKey = (screen: ScreenManifest) => `${screen.module}:${screen.id}`;

/**
 * Reads the screen bundles available for the chosen modules. Directories starting
 * with `_` are holding areas for route code that has not been ported into a bundle
 * yet — they are deliberately not selectable and never copied.
 */
async function discoverScreens(modules: string[]): Promise<ScreenManifest[]> {
  const found: ScreenManifest[] = [];

  for (const mod of modules) {
    const screensDir = path.join(TEMPLATES_DIR, 'modules', mod, 'screens');
    if (!(await fs.pathExists(screensDir))) continue;

    for (const entry of (await fs.readdir(screensDir)).sort()) {
      if (entry.startsWith('_')) continue;
      const manifestPath = path.join(screensDir, entry, 'manifest.json');
      if (!(await fs.pathExists(manifestPath))) continue;
      found.push((await fs.readJson(manifestPath)) as ScreenManifest);
    }
  }

  return found;
}

/**
 * Expands a selection to include everything the chosen bundles declare in `requires`,
 * so a screen never ships without the siblings it links to.
 */
function resolveScreenRequires(
  selected: string[],
  available: ScreenManifest[],
): ScreenManifest[] {
  const byKey = new Map(available.map((screen) => [screenKey(screen), screen]));
  const chosen = new Map<string, ScreenManifest>();

  const visit = (key: string) => {
    if (chosen.has(key)) return;
    const screen = byKey.get(key);
    if (!screen) return;
    chosen.set(key, screen);
    for (const requiredId of screen.requires ?? []) {
      visit(requiredId.includes(':') ? requiredId : `${screen.module}:${requiredId}`);
    }
  };

  for (const key of selected) visit(key);
  return [...chosen.values()];
}

/**
 * How much of a module's route surface has been ported to screen bundles. Anything
 * still sitting in a `_` directory is not selectable and never copied, so reporting it
 * is the honest way to say "partially ported" without a flag that has to be maintained
 * by hand.
 */
async function moduleCoverage(mod: string): Promise<{ bundles: number; pending: boolean }> {
  const screensDir = path.join(TEMPLATES_DIR, 'modules', mod, 'screens');
  if (!(await fs.pathExists(screensDir))) return { bundles: 0, pending: false };

  const entries = await fs.readdir(screensDir);
  let bundles = 0;
  let pending = false;

  for (const entry of entries) {
    if (entry.startsWith('_')) {
      pending = true;
      continue;
    }
    if (await fs.pathExists(path.join(screensDir, entry, 'manifest.json'))) bundles += 1;
  }

  return { bundles, pending };
}

function validateProjectName(value: string): string | undefined {
  if (!value.trim()) return 'Project name is required.';
  if (!/^[a-z0-9][a-z0-9-_.]*$/.test(value))
    return 'Use lowercase letters, numbers, hyphens, underscores, or dots.';
  if (value.length > 214) return 'Name too long (max 214 characters).';
}

async function deepMergePackageJson(
  base: Record<string, unknown> & { dependencies: Record<string, string> },
  overlay: {
    scripts?: Record<string, string>;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  }
): Promise<void> {
  if (overlay.scripts) {
    base.scripts = {
      ...((base.scripts as Record<string, string>) ?? {}),
      ...overlay.scripts,
    };
  }
  if (overlay.dependencies) {
    base.dependencies = { ...base.dependencies, ...overlay.dependencies };
  }
  if (overlay.devDependencies) {
    base.devDependencies = {
      ...((base.devDependencies as Record<string, string>) ?? {}),
      ...overlay.devDependencies,
    };
  }
}

async function main() {
  const args = process.argv.slice(2);
  const noInstall = args.includes('--no-install');
  const argName = args.find((a) => !a.startsWith('-'));
  const validArg = argName ? argName : undefined;

  // Any prompt whose answer arrives as a flag is skipped, so supplying all of them
  // makes a run non-interactive. That is what CI drives: scripting a scaffolder by
  // feeding keystrokes to its prompts over a pseudo-terminal is a maintenance
  // liability, and these are useful to anyone automating a project's creation.
  //
  //   --template <superprototype|native>
  //   --pm <pnpm|npm|yarn>
  //   --modules <none|content,logistic>
  //   --screens <all|none|logistic:supplier,...>
  const flag = (name: string): string | undefined => {
    const inline = args.find((a) => a.startsWith(`--${name}=`));
    if (inline) return inline.slice(name.length + 3);
    const index = args.indexOf(`--${name}`);
    return index >= 0 ? args[index + 1] : undefined;
  };

  const csv = (value: string | undefined): string[] | undefined => {
    if (value === undefined) return undefined;
    if (value === 'none') return [];
    return value.split(',').map((part) => part.trim()).filter(Boolean);
  };

  const templateFlag = flag('template');
  const pmFlag = flag('pm');
  const modulesFlag = csv(flag('modules'));
  const screensFlag = flag('screens');

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
  const templateChoice = templateFlag ?? (await p.select({
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
        hint: 'on hold — not available',
      },
    ],
  }));
  if (p.isCancel(templateChoice)) {
    p.cancel('Cancelled.');
    process.exit(0);
  }
  if (templateChoice === 'native') {
    p.cancel('The Native template is on hold and not available. Select SuperPrototype to continue.');
    process.exit(0);
  }
  const scaffoldTemplate = templateChoice as ScaffoldTemplate;

  // ── Package manager ───────────────────────────────────────────────────────
  const pm = pmFlag ?? (await p.select({
    message: 'Package manager',
    options: [
      { value: 'pnpm' as PackageManager, label: 'pnpm' },
      { value: 'npm' as PackageManager, label: 'npm' },
      { value: 'yarn' as PackageManager, label: 'yarn' },
    ],
  }));
  if (p.isCancel(pm)) {
    p.cancel('Cancelled.');
    process.exit(0);
  }

  // ── Module selection ──────────────────────────────────────────────────────
  //
  // Each option's hint reports its screen coverage, read from the template tree. This
  // replaces the hardcoded "on hold" gate Logistic carried: that gate existed because
  // its route templates called a data layer SuperPrototype had dropped, and moving the
  // unported ones into screens/_unported/ — where nothing copies them — is what
  // actually fixed it. A module with no bundles is still perfectly installable; it just
  // brings schema, components and SQL rather than pages.
  const moduleOptions = await Promise.all(
    MODULE_CATALOG.map(async (mod) => {
      const { bundles, pending } = await moduleCoverage(mod.id);
      const coverage =
        bundles === 0
          ? pending
            ? 'no screens yet — schema, components and SQL only'
            : 'schema, components and SQL'
          : `${bundles} screen bundle${bundles === 1 ? '' : 's'}${pending ? ', more in progress' : ''}`;

      return { value: mod.id, label: mod.label, hint: `${mod.blurb} · ${coverage}` };
    }),
  );

  const selectedModules =
    modulesFlag ??
    (await p.multiselect({
      message: 'Select domain modules to include',
      options: moduleOptions,
      required: false,
    }));
  if (p.isCancel(selectedModules)) {
    p.cancel('Cancelled.');
    process.exit(0);
  }

  const modules = selectedModules as string[];

  const unknownModules = modules.filter((mod) => !MODULE_CATALOG.some((m) => m.id === mod));
  if (unknownModules.length > 0) {
    p.cancel(`Unknown module(s): ${unknownModules.join(', ')}`);
    process.exit(1);
  }

  // ── Screen selection ──────────────────────────────────────────────────────
  //
  // Modules ship schema, components and SQL; the screens that use them are scaffolded
  // from the template tree and owned by this project afterwards. Not every app wants
  // every screen a module offers, so they are chosen here rather than assumed.
  const availableScreens = await discoverScreens(modules);
  let chosenScreens: ScreenManifest[] = [];

  if (availableScreens.length > 0) {
    const multipleModules = new Set(availableScreens.map((s) => s.module)).size > 1;

    const screenChoice =
      screensFlag === 'all'
        ? availableScreens.map(screenKey)
        : screensFlag !== undefined
          ? (csv(screensFlag) as string[])
          : await p.multiselect({
              message: 'Select screens to scaffold',
              options: availableScreens.map((screen) => ({
                value: screenKey(screen),
                label: multipleModules ? `${screen.module}: ${screen.label}` : screen.label,
                hint: screen.hint,
              })),
              initialValues: availableScreens.map(screenKey),
              required: false,
            });
    if (p.isCancel(screenChoice)) {
      p.cancel('Cancelled.');
      process.exit(0);
    }

    chosenScreens = resolveScreenRequires(screenChoice as string[], availableScreens);

    const pulledIn = chosenScreens.length - (screenChoice as string[]).length;
    if (pulledIn > 0) {
      p.log.info(
        `Added ${pulledIn} screen(s) required by your selection: ` +
          chosenScreens
            .filter((s) => !(screenChoice as string[]).includes(screenKey(s)))
            .map((s) => s.label)
            .join(', '),
      );
    }
  }

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
  const pkg = (await fs.readJson(pkgPath)) as Record<string, unknown> & {
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
      const templatePkg = (await fs.readJson(templatePkgPath)) as {
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
      };
      await deepMergePackageJson(pkg, templatePkg);
    }

    // Stamp the project name into supabase/config.toml. project_id namespaces the
    // local Docker containers (supabase_db_<project_id>); left at the template's
    // placeholder, every scaffolded project would fight over the same container names.
    const configPath = path.join(targetDir, 'supabase', 'config.toml');
    if (await fs.pathExists(configPath)) {
      const config = await fs.readFile(configPath, 'utf8');
      await fs.writeFile(
        configPath,
        config.replace(/^project_id = ".*"$/m, `project_id = "${projectName}"`)
      );
    }
  }

  // ── Step 3: Copy module templates ─────────────────────────────────────────
  for (const mod of modules) {
    const modDir = path.join(TEMPLATES_DIR, 'modules', mod);

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
        `@sveltebuilder-${mod}.json`
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

  // ── Step 3b: Copy selected screen bundles ─────────────────────────────────
  //
  // Each bundle is two halves: `ui/` is provider-neutral (the +page.svelte files, which
  // import their view-model types from the module) and `server.<template>/` holds the
  // loaders and form actions for the chosen scaffold flavour. They merge into the same
  // route directories, which is how a screen and its loader end up side by side in the
  // generated project despite being authored apart.
  for (const screen of chosenScreens) {
    const screenDir = path.join(TEMPLATES_DIR, 'modules', screen.module, 'screens', screen.id);

    for (const half of ['ui', `server.${scaffoldTemplate}`]) {
      const from = path.join(screenDir, half);
      if (await fs.pathExists(from)) {
        await fs.copy(from, path.join(targetDir, 'src', 'routes'), { overwrite: true });
      }
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
    p.log.info(
      'Skipping install (--no-install). Run `sveltebuilder sync:supabase` manually after installing.'
    );
  } else {
    s.start(`Installing dependencies with ${pm}...`);
    const installResult = await new Promise<{ status: number; stderr: string }>((resolve) => {
      const child = spawn(pm as string, ['install'], {
        cwd: targetDir,
        stdio: 'pipe',
        shell: process.platform === 'win32',
      });
      let stderr = '';
      child.stderr?.on('data', (chunk: Buffer) => {
        stderr += chunk;
      });
      child.on('close', (code) => resolve({ status: code ?? 1, stderr }));
    });
    if (installResult.status !== 0) {
      s.stop(pc.yellow('Install failed'));
      p.log.warn(
        `Run \`${pm} install\` inside ${pc.cyan(projectName)} once dependencies are available.`
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
      s.stop(
        pc.yellow('Migration generation skipped — run `sveltebuilder sync:supabase` manually')
      );
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
    nextSteps.push(
      `  ${pc.dim('cp')} .env.example .env`
    );
    nextSteps.push(`  ${pc.dim(`${pm} sveltebuilder sync:supabase`)}`);
    nextSteps.push('');
    nextSteps.push(`  ${pc.dim('# Local development (Docker required):')}`);
    nextSteps.push(`  ${pc.dim(`${pm} db:start`)}          ${pc.dim('# prints local URL + keys — copy them into .env')}`);
    nextSteps.push(`  ${pc.dim(`${pm} db:reset`)}          ${pc.dim('# applies migrations + seed.sql')}`);
    nextSteps.push('');
    nextSteps.push(`  ${pc.dim('# — or deploy against a hosted Supabase project instead:')}`);
    nextSteps.push(`  ${pc.dim('supabase link --project-ref <project-ref>')}`);
    nextSteps.push(`  ${pc.dim('supabase db push')}`);
    nextSteps.push(`  ${pc.dim('# then add its credentials to .env')}`);
  }
  if (noInstall) {
    nextSteps.push(
      `  ${pc.dim(pm + ' install')}   ${pc.dim('# install deps when packages are published')}`
    );
  }
  nextSteps.push(`  ${pc.dim(runCmd)}`);
  p.outro(nextSteps.join('\n'));
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(pc.red(`\nError: ${message}`));
  process.exit(1);
});
