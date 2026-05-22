#!/usr/bin/env node
import { Command } from 'commander';
import { createRequire } from 'node:module';
import { sync } from './commands/sync.ts';

const require = createRequire(import.meta.url);
const { version } = require('../package.json') as { version: string };

const program = new Command();

program.name('sveltebuilder').description('SvelteBuilder CLI').version(version);

program
  .command('sync')
  .description('Discover schema manifests, resolve topological order, and write supabase/config.toml')
  .action(sync);

program.parse();
