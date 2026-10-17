---
'create-sveltebuilder': patch
---

Scaffolds now depend on the SvelteBuilder packages of the release that created them, pinned as `^<version>`, instead of `latest`. Under a prerelease `latest` meant the previous major: `npm create sveltebuilder@rc` installed 1.x packages under 2.0 templates and the project failed `svelte-check` with 201 errors.

Scaffolds also get their `.gitignore` again. npm never publishes a file named `.gitignore`, so it was missing from every project created from the published package, and a first `git add .` committed `.env`. The template now stores it as `gitignore` and the CLI renames it.
