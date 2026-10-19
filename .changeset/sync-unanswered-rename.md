---
'@sveltebuilder/cli': patch
---

`sync:supabase` fails when drizzle-kit asks whether a schema object was renamed and there is no terminal to answer. drizzle-kit gave up at the question and exited 0, so sync reported success having written no schema migration. It now names the question and asks you to run sync in a terminal.
