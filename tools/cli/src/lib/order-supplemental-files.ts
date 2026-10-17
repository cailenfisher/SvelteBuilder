import path from 'node:path';
import { ACCESS_CORE_FILE, ACCESS_GENERATED_FILE } from './generate-access-sql.ts';

/**
 * The order supplemental SQL applies in: by file name, except that the generated access SQL
 * goes directly after the core access SQL it calls, whatever either is named (A21 in
 * docs/ACCESS-CONTROL-DECISIONS.md). A name prefix could only guarantee that by accident.
 *
 * Takes and returns paths; only the base name decides.
 */
export function orderSupplementalFiles(files: readonly string[]): string[] {
  const ordered = [...files].sort();
  const generatedIndex = ordered.findIndex((f) => path.basename(f) === ACCESS_GENERATED_FILE);
  if (generatedIndex === -1) return ordered;

  const [generated] = ordered.splice(generatedIndex, 1);
  const coreIndex = ordered.findIndex((f) => path.basename(f) === ACCESS_CORE_FILE);
  if (generated === undefined || coreIndex === -1) {
    throw new Error(
      `${ACCESS_GENERATED_FILE} calls the functions in ${ACCESS_CORE_FILE}, which is missing ` +
        'from supabase/supplemental/',
    );
  }
  ordered.splice(coreIndex + 1, 0, generated);
  return ordered;
}
