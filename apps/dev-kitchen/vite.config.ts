import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

// The workspace packages are aliased to source in svelte.config.js, so a save in
// packages/coreui re-renders through HMR with no svelte-package step. That is the reason
// this app exists (docs/DEV-KITCHEN.md, Job 1), and it means it does not check what
// `pnpm scaffold:check` checks: an alias bypasses each package's `exports` map and
// `files` array, so this app can render a component no published consumer could import.
export default defineConfig({
  plugins: [sveltekit()],
  resolve: {
    // Aliased source lives under packages/*, and each package resolves its own
    // dependencies from its own node_modules. One instance of each of these is not
    // optional: diglossia and coreui's message bus pass state through Svelte context,
    // whose keys are module-level symbols, and two copies of svelte break every Snippet.
    dedupe: ['svelte', 'diglossia', 'bits-ui'],
  },
  ssr: {
    // The scaffold's own vite.config.ts carries the same list. Svelte packages have to be
    // compiled in Vite's pipeline for SSR rather than handed to Node, which would receive
    // raw .svelte files. Server rendering is kept on deliberately: the bugs this repo has
    // been bitten by most (a dictionary built in $effect, a context read that throws only
    // on the server) are invisible to a client-only harness.
    noExternal: [/^@sveltebuilder\//, 'bits-ui', 'svelte-toolbelt', 'runed'],
  },
});
