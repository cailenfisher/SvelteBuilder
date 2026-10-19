import fs from 'fs-extra';
import path from 'node:path';

/**
 * Template files stored in templates/ under a name other than the one a scaffold gets, by the
 * stored name and the real name, both relative to the scaffold's root.
 *
 * - npm never packs a file called `.gitignore` (nor `.npmrc`), so a template's `.gitignore`
 *   silently vanished from the published package and every scaffold shipped without one, `.env`
 *   included in its first commit.
 * - Claude Code loads a `CLAUDE.md`, and a `.claude/rules/` directory, from any subdirectory it
 *   works in. Under their real names, the instructions written for a scaffolded app would also
 *   load while working on this repository's templates, mixed in with the repository's own.
 */
export const TEMPLATE_STORED_NAMES: Record<string, string> = {
  gitignore: '.gitignore',
  'CLAUDE.template.md': 'CLAUDE.md',
  'claude-rules': '.claude/rules',
};

/**
 * Gives a freshly copied template's stored files their real names. Run it after every template
 * layer is copied, since a later layer can carry its own stored files and replaces the earlier
 * layer's.
 */
export async function restoreTemplateStoredNames(targetDir: string): Promise<void> {
  for (const [storedName, realName] of Object.entries(TEMPLATE_STORED_NAMES)) {
    const stored = path.join(targetDir, storedName);
    if (await fs.pathExists(stored)) {
      await fs.move(stored, path.join(targetDir, realName), { overwrite: true });
    }
  }
}
