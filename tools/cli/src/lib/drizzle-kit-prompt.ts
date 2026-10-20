/**
 * drizzle-kit asks whether each schema object it cannot match was created or renamed. With no
 * terminal to answer, it reads end-of-input at the first question, exits 0 and writes nothing, so
 * its exit status cannot tell a project with no changes from one stuck on a rename. Its output can:
 * the question is printed before it gives up.
 */
const RENAME_QUESTION = /^.*\bcreated or renamed from another\b.*$/m;

/** The rename question drizzle-kit left unanswered in this output, or null when it asked none. */
export function unansweredDrizzleKitPrompt(output: string): string | null {
  return RENAME_QUESTION.exec(output)?.[0].trim() ?? null;
}
