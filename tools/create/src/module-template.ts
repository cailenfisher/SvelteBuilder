import fs from 'fs-extra';
import path from 'node:path';

export type ModuleTemplateCopy = {
  /** The create CLI's `templates/` directory. */
  templatesDir: string;
  /** A module id, such as `logistic`. */
  module: string;
  /** The scaffold flavour, such as `superprototype`. */
  scaffoldTemplate: string;
  /** The project being scaffolded. */
  targetDir: string;
};

/**
 * Copies everything a module brings to a project whether or not any of its screens are
 * chosen: supplemental SQL, the schema registry manifest, the seed, and the module's data
 * modules for the chosen flavour.
 *
 * The data modules (`templates/modules/<module>/server.<flavour>/`) land in
 * `src/lib/server/<module>/`, one file per concept. They are the module's backend seam:
 * every screen bundle's loaders and actions call them rather than building queries inline,
 * and sibling bundles that read the same concept share them. They cannot ship in the
 * package (guardrail 11), and a bundle-local file would be invisible to the bundle's
 * siblings, which is why they travel with the module instead.
 */
export async function copyModuleTemplate({
  templatesDir,
  module,
  scaffoldTemplate,
  targetDir,
}: ModuleTemplateCopy): Promise<void> {
  const moduleDir = path.join(templatesDir, 'modules', module);

  // Supplemental SQL (RLS, triggers, cross-FK constraints) goes to supabase/supplemental/.
  const supplementalDir = path.join(moduleDir, 'supplemental');
  if (await fs.pathExists(supplementalDir)) {
    await fs.copy(supplementalDir, path.join(targetDir, 'supabase', 'supplemental'), {
      overwrite: true,
    });
  }

  // The manifest goes to .sveltebuilder/registry/, where sync:supabase discovers it.
  const manifestSource = path.join(moduleDir, 'manifest.json');
  if (await fs.pathExists(manifestSource)) {
    await fs.copy(
      manifestSource,
      path.join(targetDir, '.sveltebuilder', 'registry', `@sveltebuilder-${module}.json`),
      { overwrite: true }
    );
  }

  // The seed goes to supabase/seeds/<module>.sql; sync:supabase appends it to seed.sql.
  const seedSource = path.join(moduleDir, 'seed', 'seed.sql');
  if (await fs.pathExists(seedSource)) {
    const seedDir = path.join(targetDir, 'supabase', 'seeds');
    await fs.ensureDir(seedDir);
    await fs.copy(seedSource, path.join(seedDir, `${module}.sql`), { overwrite: true });
  }

  const serverSource = path.join(moduleDir, `server.${scaffoldTemplate}`);
  if (await fs.pathExists(serverSource)) {
    await fs.copy(serverSource, path.join(targetDir, 'src', 'lib', 'server', module), {
      overwrite: true,
    });
  }
}
