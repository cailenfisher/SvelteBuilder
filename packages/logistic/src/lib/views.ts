import type { DictionaryPayload } from 'diglossia';
import type {
  AdjustmentReason,
  CycleCount,
  CycleCountLine,
  CycleCountStatus,
  InboundReceipt,
  InboundReceiptLine,
  InboundReceiptStatus,
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

/**
 * Every screen in this module needs the module's own copy, and the root dictionary
 * does not carry it — `get_dictionary` treats a null scope filter as "scope is
 * null", so scoped copy has to be loaded and provided by the screen's own loader.
 *
 * The payload must already be resolved to one entry per key; diglossia only
 * flattens it. It carries both the module's UI copy (scope 'logistic') and the
 * entity-bound copy the screen renders (scope = table name, entity_id = row id).
 */
export type ScreenCopy = {
  copy: DictionaryPayload;
};

export type SupplierWithContacts = Supplier & {
  contacts: SupplierContact[];
};

/** `/admin/logistic/supplier` */
export type SupplierListView = ScreenCopy & {
  suppliers: SupplierWithContacts[];
};

/** `/admin/logistic/supplier/[id]` */
export type SupplierDetailView = ScreenCopy & {
  supplier: SupplierWithContacts;
};

/**
 * The locale a screen formats dates and numbers in.
 *
 * Carried on the view rather than read from the root layout's data, because a screen is
 * provider-neutral and the layout's shape is the scaffold's business. The loader knows
 * it from `locals.locale`; this keeps the screen from having to know where that lives.
 */
export type ScreenLocale = {
  localeCode: string;
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

/** `/admin/logistic/stock` */
export type StockListView = ScreenCopy &
  ScreenLocale & {
    levels: StockLevelRow[];
    /** The adjustment log for one level, when the screen is showing its history. */
    history: StockAdjustment[];
    historyId: number | null;
    lowOnly: boolean;
    /**
     * Reasons a human may pick. The operational ones — inbound_receipt, pick,
     * return_restock, cycle_count_variance — are written by their own workflows and
     * would be a lie if chosen by hand, so the loader decides this rather than the
     * screen enumerating the enum.
     */
    manualReasons: AdjustmentReason[];
  };

/**
 * A server-paginated list. The screen renders the controls and links the page; the loader
 * owns the slice, because DataTable is deliberately a controlled component — sorting and
 * paging client-side would mean shipping every row to do it.
 */
export type ScreenPage = {
  page: number;
  perPage: number;
  /** Rows matching the filter, not rows on this page. */
  total: number;
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

export type LocationOption = EntityOption & {
  locationType: StorageLocationType;
};

// ── Inbound receipts ─────────────────────────────────────────────────────────

export type InboundReceiptLineRow = InboundReceiptLine & {
  storageLocation: LocationOption;
};

/**
 * A receipt as a list row, shaped for `ReceiptCard`.
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

/** `/admin/logistic/receipt` */
export type InboundReceiptListView = ScreenCopy &
  ScreenLocale &
  ScreenPage & {
    receipts: InboundReceiptRow[];
    /** Null means unfiltered, which is not the same as any particular status. */
    status: InboundReceiptStatus | null;
    /** Active suppliers, for the create form. Empty is valid — blind receiving. */
    suppliers: EntityOption[];
  };

/** `/admin/logistic/receipt/[id]` */
export type InboundReceiptDetailView = ScreenCopy &
  ScreenLocale & {
    receipt: InboundReceipt & { lines: InboundReceiptLineRow[] };
    locations: LocationOption[];
  };

// ── Shipments ────────────────────────────────────────────────────────────────

export type ShipmentRow = Shipment & {
  lineCount: number;
};

/** `/admin/logistic/shipment` */
export type ShipmentListView = ScreenCopy &
  ScreenLocale &
  ScreenPage & {
    shipments: ShipmentRow[];
    status: ShipmentStatus | null;
    /**
     * Every status that can be filtered on, from the loader rather than enumerated in the
     * screen. The filter row this replaced listed five of the six and silently omitted
     * `packed`, so packed shipments could not be filtered for at all.
     */
    statuses: ShipmentStatus[];
  };

/** `/admin/logistic/shipment/[id]` */
export type ShipmentDetailView = ScreenCopy &
  ScreenLocale & {
    shipment: Shipment & {
      lines: ShipmentLine[];
      /** Newest first — a carrier's own ordering is not dependable. */
      trackingEvents: TrackingEvent[];
    };
    /** The statuses an operator may move this shipment to. */
    statuses: ShipmentStatus[];
  };

// ── Return authorizations ────────────────────────────────────────────────────

export type ReturnAuthorizationRow = ReturnAuthorization & {
  lineCount: number;
};

/** `/admin/logistic/return` */
export type ReturnListView = ScreenCopy &
  ScreenLocale &
  ScreenPage & {
    returns: ReturnAuthorizationRow[];
    status: ReturnAuthorizationStatus | null;
    /** Filterable statuses, from the loader — see ShipmentListView for why. */
    statuses: ReturnAuthorizationStatus[];
  };

/** `/admin/logistic/return/[id]` */
export type ReturnDetailView = ScreenCopy &
  ScreenLocale & {
    returnAuthorization: ReturnAuthorization & { lines: ReturnAuthorizationLine[] };
    /** Where restocked returns may go — bins only, since nothing else holds stock. */
    locations: LocationOption[];
    /**
     * The grading vocabulary, from the loader rather than spelled out in the screen. The
     * original listed all eight values as literal markup, which is how a screen and an
     * enum drift apart without anything noticing.
     */
    conditions: ReturnCondition[];
    dispositions: ReturnDisposition[];
  };

// ── Cycle counts ─────────────────────────────────────────────────────────────

export type CycleCountLineRow = CycleCountLine & {
  storageLocation: LocationOption;
};

export type CycleCountRow = CycleCount & {
  lineCount: number;
  /** Lines counted so far, so the list can show progress without embedding them. */
  countedCount: number;
};

/** `/admin/logistic/cycle-count` */
export type CycleCountListView = ScreenCopy &
  ScreenLocale &
  ScreenPage & {
    counts: CycleCountRow[];
    status: CycleCountStatus | null;
    /** Filterable statuses, from the loader — see ShipmentListView for why. */
    statuses: CycleCountStatus[];
    /** Locations a new count can be opened against — bins only, since stock lives there. */
    locations: LocationOption[];
  };

/** `/admin/logistic/cycle-count/[id]` */
export type CycleCountDetailView = ScreenCopy &
  ScreenLocale & {
    cycleCount: CycleCount & { lines: CycleCountLineRow[] };
  };

/**
 * What a screen's form actions return. `fail()` payloads and successful returns share
 * one shape so a screen can render `form?.error` without narrowing per action — which
 * is why the success branch declares `error?: undefined` rather than omitting the key:
 * a union whose members disagree on which keys exist cannot be read through `?.` at
 * all, only narrowed first.
 */
export type ScreenFormResult =
  | { success: true; message?: string; error?: undefined }
  | { success?: false; error: string };
