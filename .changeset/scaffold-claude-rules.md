---
'create-sveltebuilder': patch
---

A SuperPrototype scaffold's Claude Code instructions are split: a leaner `CLAUDE.md` that loads in every session, plus `.claude/rules/database.md` (schema, RLS, RPCs, access control, seeds) and `.claude/rules/component.md` (components, coreui, styling, accessibility), which load only when Claude opens a matching file. The coreui component list now points at the installed package's README instead of repeating it. In this repository the files are stored as `CLAUDE.template.md` and `claude-rules/` and renamed on copy, the same way as `gitignore`.
