# create-sveltebuilder

The one-time project scaffolding tool for [SvelteBuilder](https://github.com/cailenfisher/SvelteBuilder), an opinionated, production-ready scaffold ecosystem for SvelteKit.

## Usage

```sh
npm create sveltebuilder@latest
```

You'll be prompted for:

1. **Project name**
2. **Scaffold template** — SuperPrototype (Supabase Auth and Postgres, ready to deploy). Native is on hold and cannot currently be selected.
3. **Package manager** — pnpm, npm, or yarn
4. **Domain modules** — each contributes its schema, components, supplemental SQL, and seed data. The prompt lists what is available and how much of each module's route surface ships as screens.
5. **Screens** — which of the selected modules' screen bundles to scaffold, defaulting to all of them. A bundle is a coherent feature — its list, its detail, and any layout they share — and selecting one pulls in the sibling bundles it links to. This step is skipped when no selected module offers any.

It then copies the base scaffold plus each selected module's templates, schema manifest, and seed SQL, merges module dependencies into `package.json`, runs `sveltebuilder sync:supabase` to assemble migrations, and installs dependencies.

Scaffolded route code belongs to your project from that point on — it is a starting point, not a dependency you track. See [MODULE-ROUTES.md](https://github.com/cailenfisher/SvelteBuilder/blob/main/docs/MODULE-ROUTES.md) for the reasoning.

## Non-interactive use

Every prompt has a flag that answers it, so supplying all of them makes a run fully non-interactive. The project name is taken from the first positional argument.

| Flag         | Answers           | Accepts                                                      |
| ------------ | ----------------- | ------------------------------------------------------------ |
| `--template` | Scaffold template | `superprototype`                                             |
| `--pm`       | Package manager   | `pnpm`, `npm`, `yarn`                                        |
| `--modules`  | Domain modules    | comma-separated module ids, or `none`                        |
| `--screens`  | Screens           | `all`, `none`, or comma-separated `module:screen` bundle ids |

`none` is how an empty selection is expressed, since an empty list is otherwise indistinguishable from an absent flag. Each flag also accepts `--flag=value`.

`npm create` requires `--` before any flags:

```sh
npm create sveltebuilder@latest my-app -- --template superprototype --pm pnpm --modules logistic --screens all
```

Pass `--no-install` to skip the dependency install step, in which case run `sveltebuilder sync:supabase` yourself once dependencies are in place:

```sh
npm create sveltebuilder@latest my-app -- --no-install
```

## Part of the SvelteBuilder ecosystem

`create-sveltebuilder` depends on `@sveltebuilder/cli` internally for schema sync — that logic is never duplicated. See the [SvelteBuilder README](https://github.com/cailenfisher/SvelteBuilder) for the full architecture, scaffold templates, and module roadmap.
