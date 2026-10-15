# @sveltebuilder/logistic

Warehouse and logistics domain module for [SvelteBuilder](https://github.com/cailenfisher/SvelteBuilder): suppliers, storage locations, stock levels, inbound receiving, pick tasks, shipments, returns, and cycle counts.

## Install

```sh
npm install @sveltebuilder/logistic diglossia @sveltebuilder/coreui
```

Typically installed via `npm create sveltebuilder@latest`, which also copies the module's schema and starter routes into your project. Installing it directly gives you the components, server helpers, and Drizzle schema as a standalone library.

## Usage

Import the module's stylesheet once, in your app's `app.css`, after coreui's and in the same
layer. Its components carry no `<style>` blocks, so without it they render unstyled. A project
made with `npm create sveltebuilder` already has this line.

```css
@import '@sveltebuilder/coreui/styles/components.css' layer(components);
@import '@sveltebuilder/logistic/styles/components.css' layer(components);
```

```ts
import { PickTaskCard, ShipmentStatusBadge, StockLevelBar } from '@sveltebuilder/logistic';
import type { InboundReceiptDetailView } from '@sveltebuilder/logistic/views';
import { stockLevel, pickTask, shipment } from '@sveltebuilder/logistic/schema';
```

- **`@sveltebuilder/logistic`** — Svelte components, split into application-level components (`PickTaskStatusBadge`, `ShipmentStatusBadge`, `ReturnConditionBadge`, `BarcodeInput` — no diglossia dependency) and entity components (`SupplierCard`, `StorageLocationPath`, `PickTaskCard`, `InboundReceiptCard`, `StockLevelBar`, `TrackingEventList` and the rest — call `getDictionary()` from `diglossia/svelte`, with an optional `dictionary` prop for overriding context). Also re-exports all schema types.
- **`@sveltebuilder/logistic/views`** — the view-model types a screen and its loader share. The module ships no queries (guardrail 11); a scaffolded project's data modules in `src/lib/server/logistic/` hold them.
- **`@sveltebuilder/logistic/styles/components.css`** — every component's styles, for the `components` layer.
- **`@sveltebuilder/logistic/schema`** — Drizzle table definitions and TypeScript types (`Supplier`, `StorageLocation`, `StockLevel`, `InboundReceipt`, `PickTask`, `Shipment`, `ReturnAuthorization`, `CycleCount`, and their line/item types).

Like all SvelteBuilder domain modules, logistic carries no `name`/`title`/`description` copy columns on its entities — user-facing copy is linked via `diglossia` (`scope` = table name, `entityId` = the row's bigint PK).

## v1 scope

**Explicitly out of scope for v1:** wave picking, cross-docking, yard management, labor management, robotics integration, demand forecasting, and multi-warehouse advanced routing.

## Part of the SvelteBuilder ecosystem

See the [SvelteBuilder README](https://github.com/cailenfisher/SvelteBuilder) for the full architecture, including how domain modules relate to `diglossia`, `@sveltebuilder/coreui`, and the CLI sync workflow.
