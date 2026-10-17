import fs from 'fs-extra';
import path from 'node:path';

/**
 * Template files that npm will not publish under their real name, by the name they are stored
 * under in templates/ and the name a scaffold gets.
 *
 * npm never packs a file called `.gitignore` (nor `.npmrc`), so a template's `.gitignore`
 * silently vanished from the published package and every scaffold shipped without one, `.env`
 * included in its first commit. Stored without the dot, renamed on copy.
 */
export const TEMPLATE_DOTFILES: Record<string, string> = {
  gitignore: '.gitignore',
};

/** Gives a freshly copied template's dotfiles their real names. */
export async function restoreTemplateDotfiles(targetDir: string): Promise<void> {
  for (const [storedName, realName] of Object.entries(TEMPLATE_DOTFILES)) {
    const stored = path.join(targetDir, storedName);
    if (await fs.pathExists(stored)) {
      await fs.move(stored, path.join(targetDir, realName), { overwrite: true });
    }
  }
}
