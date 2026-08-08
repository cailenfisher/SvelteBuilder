# @sveltebuilder/logistic

Warehouse and logistics domain module for [SvelteBuilder](https://github.com/cailenfisher/SvelteBuilder): suppliers, storage locations, stock levels, inbound receiving, pick tasks, shipments, returns, and cycle counts.

## Install

```sh
npm install @sveltebuilder/logistic @sveltebuilder/hermes @sveltebuilder/coreui
```

Typically installed via `npm create sveltebuilder@latest`, which also copies the module's schema and starter routes into your project. Installing it directly gives you the components, server helpers, and Drizzle schema as a standalone library.

## Usage

```ts
import { PickTaskCard, ShipmentStatusBadge, StockLevelBar } from '@sveltebuilder/logistic';
import { getStockLevels, createPickTask, receiveReceiptLine } from '@sveltebuilder/logistic/server';
import { stockLevel, pickTask, shipment } from '@sveltebuilder/logistic/schema';
```

- **`@sveltebuilder/logistic`** — Svelte components, split into Camp 1 (`PickTaskStatusBadge`, `ShipmentStatusBadge`, `ReturnConditionBadge`, `StockLevelBar`, `TrackingEventList` — no hermes dependency) and Camp 2 (`SupplierCard`, `StorageLocationPath`, `PickTaskCard`, `ReceiptCard` — import hermes and require `hermes.load()` before mount). Also re-exports all schema types.
- **`@sveltebuilder/logistic/server`** — query and mutation helpers covering the full warehouse workflow: `getStockLevels`/`adjustStock`, `createInboundReceipt`/`receiveReceiptLine`, `createPickTask`/`assignPickTask`/`recordPickedQuantity`/`completePickTask`, `createShipment`/`updateShipmentTracking`, `createReturnAuthorization`/`gradeReturnLine`, `createCycleCount`/`recordCycleCountLine`/`approveCycleCount`, and `getLogisticMetrics`.
- **`@sveltebuilder/logistic/schema`** — Drizzle table definitions and TypeScript types (`Supplier`, `StorageLocation`, `StockLevel`, `InboundReceipt`, `PickTask`, `Shipment`, `ReturnAuthorization`, `CycleCount`, and their line/item types).

Like all SvelteBuilder domain modules, logistic carries no `name`/`title`/`description` copy columns on its entities — user-facing copy is linked via `@sveltebuilder/hermes` (`scope` = table name, `entityId` = the row's bigint PK).

## v1 scope

**Explicitly out of scope for v1:** wave picking, cross-docking, yard management, labor management, robotics integration, demand forecasting, and multi-warehouse advanced routing.

## Part of the SvelteBuilder ecosystem

See the [SvelteBuilder README](https://github.com/cailenfisher/SvelteBuilder) for the full architecture, including how domain modules relate to `@sveltebuilder/hermes`, `@sveltebuilder/coreui`, and the CLI sync workflow.
