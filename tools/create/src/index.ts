// create-sveltebuilder CLI entry point

// Flow:
// 1. Prompt — project name, package manager, module selection
// 2. Copy templates/base/ into target directory
// 3. Copy selected module template fragments into target
// 4. Write _registry manifest files for selected modules
// 5. Write package.json with correct @sveltebuilder/* dependencies
// 6. Write .env.example with Supabase vars
// 7. Call `sveltebuilder sync` via @sveltebuilder/cli to finalize schema_paths
// 8. Run package manager install
