# create-sveltebuilder

The one-time project scaffolding tool for [SvelteBuilder](https://github.com/cailenfisher/SvelteBuilder), an opinionated, production-ready scaffold ecosystem for SvelteKit.

## Usage

```sh
npm create sveltebuilder@latest
```

You'll be prompted for:

1. **Project name**
2. **Scaffold template** — currently SuperPrototype (Supabase, batteries-included); Native (Drizzle, bring-your-own-auth) is not yet available.
3. **Package manager** — pnpm, npm, or yarn
4. **Domain modules** — currently `content` (publisher/news: articles, sections, taxonomy, live coverage, newsletter, RSS, sitemap) and `logistic` (warehouse: receiving, pick tasks, shipments, returns, cycle counts)

It then copies the base scaffold plus each selected module's templates, schema manifest, and seed SQL, merges module dependencies into `package.json`, runs `sveltebuilder sync:supabase` to assemble migrations, and installs dependencies.

Pass `--no-install` to skip the dependency install step (you'll need to run `sveltebuilder sync:supabase` yourself afterward):

```sh
npm create sveltebuilder@latest my-app -- --no-install
```

## Part of the SvelteBuilder ecosystem

`create-sveltebuilder` depends on `@sveltebuilder/cli` internally for schema sync — that logic is never duplicated. See the [SvelteBuilder README](https://github.com/cailenfisher/SvelteBuilder) for the full architecture, scaffold templates, and module roadmap.
