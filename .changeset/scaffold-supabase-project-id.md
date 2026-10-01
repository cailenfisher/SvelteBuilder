---
"create-sveltebuilder": patch
---

Give each scaffolded project its own Supabase `project_id`.

The SuperPrototype template's `supabase/config.toml` had no `project_id`, so the CLI fell back to
naming the local Docker containers after the working directory. The template now declares the key and
the scaffolder rewrites it to the project name, so containers are `supabase_db_<project-name>` and a
folder rename no longer moves the stack out from under a project.
