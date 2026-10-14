---
'@sveltebuilder/coreui': major
'@sveltebuilder/content': major
'@sveltebuilder/logistic': major
'@sveltebuilder/local-text-schema': minor
'create-sveltebuilder': minor
---

`nav` is spelled `navigation` everywhere. Copy slugs `nav.*`, `admin.nav.*`, `logistic.admin.nav.*`
and `logistic.warehouse.nav` become `navigation.*`, `admin.navigation.*`,
`logistic.admin.navigation.*` and `logistic.warehouse.navigation`; `docs/MIGRATION-2.0.md` has the
SQL that renames them in an existing database. coreui's `.pagination__button--nav` becomes
`.pagination__button--navigation`. In scaffolded screens, `navItems` and `navItem` become
`navigationItems` and `navigationItem`.
