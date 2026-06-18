#!/usr/bin/env node
import { Command } from 'commander';
import { createRequire } from 'node:module';
import { syncSupabase } from './commands/sync-supabase.ts';
import { syncDrizzle } from './commands/sync-drizzle.ts';
import { sync } from './commands/sync.ts';

const require = createRequire(import.meta.url);
const { version } = require('../package.json') as { version: string };

const program = new Command();

program.name('sveltebuilder').description('SvelteBuilder CLI').version(version);

program
  .command('sync:supabase')
  .description(
    'Generate Supabase migrations from Drizzle schemas, append supplemental SQL, and write seed.sql',
  )
  .action(async () => { await syncSupabase(); });

program
  .command('sync:drizzle')
  .description('Assemble Drizzle schema for Native (not yet implemented)')
  .action(async () => { await syncDrizzle(); });

program
  .command('sync')
  .description('(deprecated) Alias for sync:supabase')
  .action(async () => { await sync(); });

program.parse();
