import type { ScreenAction, ScreenCopy, ScreenLocale, ScreenPage } from '@sveltebuilder/coreui';
import type {
  StockAdjustmentReason,
  CycleCount,
  CycleCountLine,
  CycleCountStatus,
  InboundReceipt,
  InboundReceiptLine,
  InboundReceiptStatus,
  PickTask,
  PickTaskLine,
  ReturnAuthorization,
  ReturnAuthorizationLine,
  ReturnAuthorizationStatus,
  ReturnCondition,
  ReturnDisposition,
  Shipment,
  ShipmentLine,
  ShipmentStatus,
  StockAdjustment,
  StockLevel,
  StorageLocation,
  StorageLocationType,
  Supplier,
  SupplierContact,
  TrackingEvent,
} from './schema/index.js';

/**
 * Screen contracts.
 *
 * A screen (`+page.svelte`) and the loader that feeds it no longer live together:
 * the screen ships once, provider-neutral, in the create CLI's template tree, while
 * the loader ships per scaffold flavour (`server.superprototype/`, and
 * `server.native/` if Native revives). Nothing typechecks across that boundary
 * until a project is scaffolded, so the boundary is stated here instead: the screen
 * imports the view type, and every flavour's loader returns it.
 *
 * These types deliberately describe what a *screen* needs, not what a table holds.
 * They are the module's API for route code, the same way its components are its API
 * for markup. See docs/MODULE-ROUTES.md.
 *
 * Not expressible here, and therefore documented per screen in its manifest.json:
 * form action names, their field names, and which of them a screen submits.
 */

export type SupplierWithContacts = Supplier & {
  contacts: SupplierContact[];
};

/** `/admin/logistic/supplier` */
export type SupplierListView = ScreenAction &
  ScreenCopy & {
  suppliers: SupplierWithContacts[];
};

/** `/admin/logistic/supplier/[id]` */
export type SupplierDetailView = ScreenAction &
  ScreenCopy & {
  supplier: SupplierWithContacts;
};

/**
 * A stock level with the location holding it.
 *
 * Note what is absent: the location's name. These types deliberately do not carry
 * resolved copy, unlike the older StorageLocationWithCopy in ./schema — a screen holds a
 * dictionary and reads `localText('name', 'storage_location', id)` itself. Baking the
 * string into the row was the shape a query layer produced, and modules no longer ship
 * one.
 */
export type StockLevelRow = StockLevel & {
  /** on_hand - reserved. Derived, never stored — see the module's schema. */
  available: number;
  storageLocation: Pick<StorageLocation, 'id' | 'slug' | 'locationType'>;
};

/** `/admin/logistic/stock-level` */
export type StockLevelListView = ScreenAction &
  ScreenCopy &
  ScreenLocale & {
    stockLevels: StockLevelRow[];
    /** The adjustment log for one level, when the screen is showing its history. */
    stockAdjustments: StockAdjustment[];
    historyStockLevelId: number | null;
    lowOnly: boolean;
    /**
     * Reasons a human may pick. The operational ones — inbound_receipt, pick,
     * return_restock, cycle_count_variance — are written by their own workflows and
     * would be a lie if chosen by hand, so the loader decides this rather than the
     * screen enumerating the enum.
     */
    manualReasons: StockAdjustmentReason[];
  };

/**
 * An entity offered in a `<Select>`, carrying only what an option needs.
 *
 * `slug` is here for a fallback and for tests, not to render: the label is entity-bound
 * copy the screen resolves with `localText('name', '<scope>', id)`. Selecting a whole row
 * to render one option would be wasteful and would tempt a screen into displaying a slug.
 */
export type EntityOption = {
  id: number;
  slug: string;
};

export type StorageLocationOption = EntityOption & {
  locationType: StorageLocationType;
};

// ── Inbound receipts ─────────────────────────────────────────────────────────

export type InboundReceiptLineRow = InboundReceiptLine & {
  storageLocation: StorageLocationOption;
};

/**
 * A receipt as a list row, shaped for `InboundReceiptCard`.
 *
 * It carries its lines because the card shows expected-versus-received totals and flags a
 * discrepancy, which cannot be known without them — and because a module's own components
 * being usable without the screen reshaping their input is rather the point. The cost is
 * bounded: the list is paginated and PostgREST embeds the lines in the same round trip,
 * so this is one query, not one per row.
 */
export type InboundReceiptRow = InboundReceipt & {
  /** Null for a blind receipt — goods arriving against no purchase order. */
  supplier: Supplier | null;
  lines: InboundReceiptLine[];
};

/** `/admin/logistic/inbound-receipt` */
export type InboundReceiptListView = ScreenAction &
  ScreenCopy &
  ScreenLocale &
  ScreenPage & {
    inboundReceipts: InboundReceiptRow[];
    /** Null means unfiltered, which is not the same as any particular status. */
    status: InboundReceiptStatus | null;
    /** Active suppliers, for the create form. Empty is valid — blind receiving. */
    suppliers: EntityOption[];
  };

/** `/admin/logistic/inbound-receipt/[id]` */
export type InboundReceiptDetailView = ScreenAction &
  ScreenCopy &
  ScreenLocale & {
    inboundReceipt: InboundReceipt & { lines: InboundReceiptLineRow[] };
    storageLocations: StorageLocationOption[];
  };

// ── Shipments ────────────────────────────────────────────────────────────────

export type ShipmentRow = Shipment & {
  lineCount: number;
};

/** `/admin/logistic/shipment` */
export type ShipmentListView = ScreenAction &
  ScreenCopy &
  ScreenLocale &
  ScreenPage & {
    shipments: ShipmentRow[];
    status: ShipmentStatus | null;
    /**
     * Every status that can be filtered on, from the loader rather than enumerated in the
     * screen. The filter row this replaced listed five of the six and silently omitted
     * `packed`, so packed shipments could not be filtered for at all.
     */
    statuses: readonly ShipmentStatus[];
  };

/** `/admin/logistic/shipment/[id]` */
export type ShipmentDetailView = ScreenAction &
  ScreenCopy &
  ScreenLocale & {
    shipment: Shipment & {
      lines: ShipmentLine[];
      /** Newest first — a carrier's own ordering is not dependable. */
      trackingEvents: TrackingEvent[];
    };
    /** The statuses an operator may move this shipment to. */
    statuses: readonly ShipmentStatus[];
  };

// ── Return authorizations ────────────────────────────────────────────────────

export type ReturnAuthorizationRow = ReturnAuthorization & {
  lineCount: number;
};

/** `/admin/logistic/return-authorization` */
export type ReturnAuthorizationListView = ScreenAction &
  ScreenCopy &
  ScreenLocale &
  ScreenPage & {
    returnAuthorizations: ReturnAuthorizationRow[];
    status: ReturnAuthorizationStatus | null;
    /** Filterable statuses, from the loader — see ShipmentListView for why. */
    statuses: readonly ReturnAuthorizationStatus[];
  };

/** `/admin/logistic/return-authorization/[id]` */
export type ReturnAuthorizationDetailView = ScreenAction &
  ScreenCopy &
  ScreenLocale & {
    returnAuthorization: ReturnAuthorization & { lines: ReturnAuthorizationLine[] };
    /** Where restocked returns may go — bins only, since nothing else holds stock. */
    storageLocations: StorageLocationOption[];
    /**
     * The grading vocabulary, from the loader rather than spelled out in the screen. The
     * original listed all eight values as literal markup, which is how a screen and an
     * enum drift apart without anything noticing.
     */
    conditions: readonly ReturnCondition[];
    dispositions: readonly ReturnDisposition[];
  };

// ── Cycle counts ─────────────────────────────────────────────────────────────

export type CycleCountLineRow = CycleCountLine & {
  storageLocation: StorageLocationOption;
};

export type CycleCountRow = CycleCount & {
  lineCount: number;
  /** Lines counted so far, so the list can show progress without embedding them. */
  countedCount: number;
};

/** `/admin/logistic/cycle-count` */
export type CycleCountListView = ScreenAction &
  ScreenCopy &
  ScreenLocale &
  ScreenPage & {
    cycleCounts: CycleCountRow[];
    status: CycleCountStatus | null;
    /** Filterable statuses, from the loader — see ShipmentListView for why. */
    statuses: readonly CycleCountStatus[];
    /** Locations a new count can be opened against — bins only, since stock lives there. */
    storageLocations: StorageLocationOption[];
  };

/** `/admin/logistic/cycle-count/[id]` */
export type CycleCountDetailView = ScreenAction &
  ScreenCopy &
  ScreenLocale & {
    cycleCount: CycleCount & { lines: CycleCountLineRow[] };
  };

// ── The warehouse worker screens ─────────────────────────────────────────────
//
// These are one feature rather than four: the shell's navigation and its home screen link to all
// three flows, so shipping any one without the others would leave dead links. See the
// bundle's manifest.

/**
 * `(warehouse)/+layout` — the shell.
 *
 * Its navigation labels are module copy rather than base-seed global copy, because a scaffold
 * without this module has no warehouse to navigate. Page data inherits a layout's data,
 * which is how the home screen gets its labels without a loader of its own.
 */
export type WarehouseShellView = ScreenCopy;

export type PickTaskLineRow = PickTaskLine & {
  storageLocation: StorageLocationOption;
};

/** `/warehouse/pick-task` */
export type PickTaskWarehouseQueueView = ScreenCopy &
  ScreenLocale & {
    /** In progress and assigned to the signed-in worker. */
    myPickTasks: PickTask[];
    /** Unassigned and open to anyone. */
    openPickTasks: PickTask[];
    openPickTaskTotal: number;
  };

/** `/warehouse/pick-task/[id]` */
export type PickTaskWarehouseDetailView = ScreenCopy &
  ScreenLocale & {
    pickTask: PickTask & { lines: PickTaskLineRow[] };
  };

/** `/warehouse/inbound-receipt` */
export type InboundReceiptWarehouseQueueView = ScreenCopy &
  ScreenLocale & {
    /** Still pending or partial — the work. */
    activeInboundReceipts: InboundReceiptRow[];
    /** Recently completed, for orientation rather than action. */
    recentInboundReceipts: InboundReceiptRow[];
  };

/**
 * `/warehouse/inbound-receipt/[id]`
 *
 * Narrower than InboundReceiptDetailView, which also carries the storage locations its add
 * a line form needs. A worker receives against lines someone else planned, so shipping
 * those locations here would be data the screen cannot use.
 */
export type InboundReceiptWarehouseDetailView = ScreenCopy &
  ScreenLocale & {
    inboundReceipt: InboundReceipt & { lines: InboundReceiptLineRow[] };
  };

/** `/warehouse/cycle-count` */
export type CycleCountWarehouseQueueView = ScreenCopy &
  ScreenLocale & {
    myCycleCounts: CycleCountRow[];
    openCycleCounts: CycleCountRow[];
  };

/** `/warehouse/cycle-count/[id]` */
export type CycleCountWarehouseDetailView = ScreenCopy &
  ScreenLocale & {
    cycleCount: CycleCount & { lines: CycleCountLineRow[] };
  };

// ── The admin dashboard ──────────────────────────────────────────────────────

/**
 * Counts of what is waiting. Each is "how many exist", not "how many are shown".
 */
export type LogisticMetrics = {
  openPickTaskCount: number;
  pendingInboundReceiptCount: number;
  openReturnAuthorizationCount: number;
  openCycleCountCount: number;
  lowStockCount: number;
};

/** `/admin/logistic` */
export type LogisticDashboardView = ScreenAction &
  ScreenCopy &
  ScreenLocale & {
    metrics: LogisticMetrics;
    /** Short previews — the metric says how many there are, these say which. */
    lowStockLevels: StockLevelRow[];
    pendingInboundReceipts: InboundReceiptRow[];
    openPickTasks: PickTask[];
    openReturnAuthorizations: ReturnAuthorizationRow[];
  };

