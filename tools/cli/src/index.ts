#!/usr/bin/env node
import { Command } from 'commander';
import { createRequire } from 'node:module';
import { syncSupabase } from './commands/sync-supabase.ts';
import { sync } from './commands/sync.ts';

const require = createRequire(import.meta.url);
const { version } = require('../package.json') as { version: string };

const program = new Command();

program.name('sveltebuilder').description('SvelteBuilder CLI').version(version);

/** Commander does not await an action's promise, so a rejection would surface as an
 *  unhandled rejection: a stack trace, and an exit code unrelated to the command. Wrapping
 *  each action keeps a failure legible and, more to the point, non-zero for the scripts
 *  that gate on it. */
const fail = (err: unknown) => {
  console.error(`[sveltebuilder] ${err instanceof Error ? err.message : String(err)}`);
  process.exitCode = 1;
};

program
  .command('sync:supabase')
  .description(
    'Generate Supabase migrations from Drizzle schemas, append supplemental SQL, and write seed.sql',
  )
  .action(async () => { try { await syncSupabase(); } catch (err) { fail(err); } });

program
  .command('sync')
  .description('(deprecated) Alias for sync:supabase')
  .action(async () => { try { await sync(); } catch (err) { fail(err); } });

program.parse();
