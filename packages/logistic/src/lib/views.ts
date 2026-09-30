import type { DictionaryPayload } from 'diglossia';
import type {
  AdjustmentReason,
  StockAdjustment,
  StockLevel,
  StorageLocation,
  Supplier,
  SupplierContact,
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
 * What a screen's form actions return. `fail()` payloads and successful returns share
 * one shape so a screen can render `form?.error` without narrowing per action — which
 * is why the success branch declares `error?: undefined` rather than omitting the key:
 * a union whose members disagree on which keys exist cannot be read through `?.` at
 * all, only narrowed first.
 */
export type ScreenFormResult =
  | { success: true; message?: string; error?: undefined }
  | { success?: false; error: string };
