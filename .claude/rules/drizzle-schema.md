---
paths:
  - "packages/*/src/lib/schema/**"
  - "packages/local-text-schema/**"
  - "**/src/lib/server/schema.ts"
---

# Domain schema rules

## No conventional copy fields — ever

Domain models never carry `name`, `title`, `label`, `description`, or any equivalent
user-facing text column. Copy is linked via `LocalTextLink`, keyed by scope + entityId.
The schema carries only `id` and structural/relational columns.

Do not add a bare text column intending to localize it later. The `LocalTextLink` wiring
is the model from the start.

## Integer primary keys — not UUIDs

Default domain entity primary keys to `integer generated always as identity` / TypeScript
`number`. `bigint` is reserved for entities expected to reach extreme row counts (event logs,
telemetry, tracking scans, per-impression records) — a deliberate, per-case choice made when the
entity is introduced, not the general pattern. Existing `bigint` PK columns (`user_account.id`,
and anything the polymorphic `entity_id` below already points at) are left as-is; this is not a
retrofit.

UUID primary keys are not used anywhere in the ecosystem. `local_text_link.entity_id` is a single
`bigint` column that holds IDs from any domain table polymorphically — an `integer` PK fits inside
it without conversion, which is why defaulting to `integer` doesn't strain that design.

## The polymorphic link

`local_text_link.entity_id` has no enforced foreign key. It points at rows across many domain
tables (`product`, `order`, `warehouse_location`, etc.). There is no FK constraint because one
column cannot reference multiple tables. This is accepted and intentional — referential integrity
is enforced by convention and tooling, not a DB constraint. Do not attempt to add a FK here.

## Core i18n schema

```sql
-- All IDs: bigint generated always as identity

local_text_link (
  id         bigint PK,
  slug       text NOT NULL,
  scope      text NULL,       -- null = global/application-level
  entity_id  bigint NULL,     -- polymorphic, no FK constraint
  UNIQUE NULLS NOT DISTINCT (slug, scope, entity_id)
  -- NULLS NOT DISTINCT is required, not cosmetic: global copy has scope and
  -- entity_id both NULL, and a plain UNIQUE treats NULLs as distinct, so it would
  -- not constrain those rows at all. See `.claude/rules/seed.md`.
)

local_text (
  id       bigint PK,
  link     bigint NOT NULL REFERENCES local_text_link(id),
  locale   bigint NOT NULL REFERENCES locale(id),
  content  text NOT NULL,
  UNIQUE (link, locale)
)

locale (
  id           bigint PK,
  code         text NOT NULL UNIQUE,  -- BCP-47: 'en', 'fr', 'pt-BR'
  name         text NOT NULL,
  native_name  text NOT NULL,
  dir          text NOT NULL DEFAULT 'ltr'  -- 'ltr' | 'rtl'
)
```

## Schema file layout (per module)

Schema is **Drizzle-first**: each package exports its tables as TypeScript, and
`sveltebuilder sync:supabase` generates the migrations (`tools/cli/CLAUDE.md`). SQL is a generated
artifact — never hand-authored for a domain module.

```
packages/<module>/
└── src/lib/
    └── schema/
        ├── index.ts          ← barrel, exported as `<pkg>/schema`
        ├── <concept>.ts      ← one table, its pgEnums and its inferred types
        └── <enum>.ts         ← one enum's values, with no drizzle-orm import (see below)
```

For example, `inbound-receipt.ts` holds the `inbound_receipt` table, and
`inbound-receipt-status.ts` exports `INBOUND_RECEIPT_STATUSES` and the `InboundReceiptStatus` type.
An enum is a concept of its own in the layer map, so its file is named after it.

Each concept's types are **inferred** from its table (`typeof inboundReceipt.$inferSelect`), never
hand-written beside it. Composite types (`InboundReceiptWithCopy`) are intersections of inferred
types.

**Enum values are declared once**, as a plain `as const` array in the enum's own module, which does
not import `drizzle-orm` (guardrail 8 bans runtime `drizzle-orm`, and screens need the values at runtime for
filters and validation). The `pgEnum` and the type union are both built from that array. A second
hand-written list of the same values is a bug.
