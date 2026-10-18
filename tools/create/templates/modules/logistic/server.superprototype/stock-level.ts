import type { SupabaseClient } from '@supabase/supabase-js';
import type { StockAdjustmentReason } from '@sveltebuilder/logistic';
import type { StockLevelRow } from '@sveltebuilder/logistic/views';
import { toOne, type QueryResult } from '$lib/server/postgrest';

/**
 * Stock levels with their location and available quantity, by SKU. With `lowOnly`, only those
 * at or under their reorder point.
 *
 * The low filter runs here rather than in the query: it compares on_hand - reserved against
 * reorder_point, three columns of the same row, which PostgREST cannot express without a view
 * or a computed column. Only rows with a reorder point can qualify, so those are all that is
 * fetched. The table is one row per SKU per bin, small enough that this is the cheaper trade;
 * revisit with a generated column if a warehouse ever makes it not so.
 */
export async function listStockLevel(
  supabase: SupabaseClient,
  filter: { lowOnly: boolean }
): Promise<QueryResult<StockLevelRow[]>> {
  let query = supabase
    .from('stock_level')
    // One string literal, not a concatenation: supabase-js derives the row type from the
    // literal, so splitting it across a `+` degrades every column to GenericStringError.
    .select(
      'id, storage_location_id, sku, on_hand, reserved, reorder_point, created_at, updated_at, storage_location!inner(id, slug, location_type)'
    );
  if (filter.lowOnly) query = query.not('reorder_point', 'is', null);

  const { data, error } = await query.order('sku');
  if (error) return { data: null, error };

  const stockLevels: StockLevelRow[] = [];
  for (const row of data) {
    // A to-one embed, which supabase-js types as an array. The join is !inner, so a null here
    // is impossible rather than merely unhandled.
    const location = toOne(row.storage_location);
    if (location === null) continue;

    const available = row.on_hand - row.reserved;
    if (filter.lowOnly && !(row.reorder_point !== null && available <= row.reorder_point)) {
      continue;
    }

    stockLevels.push({
      id: row.id,
      storageLocationId: row.storage_location_id,
      sku: row.sku,
      onHand: row.on_hand,
      reserved: row.reserved,
      reorderPoint: row.reorder_point,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      available,
      storageLocation: {
        id: location.id,
        slug: location.slug,
        locationType: location.location_type,
      },
    });
  }
  return { data: stockLevels, error: null };
}

/** An alerting threshold, not a stock movement, so it writes no audit row. */
export async function setStockLevelReorderPoint(
  supabase: SupabaseClient,
  id: number,
  reorderPoint: number | null
): Promise<QueryResult<null>> {
  const { error } = await supabase
    .from('stock_level')
    .update({ reorder_point: reorderPoint })
    .eq('id', id);
  if (error) return { data: null, error };
  return { data: null, error: null };
}

/**
 * A correction by hand: moves on_hand and appends the audit row, recorded against the caller,
 * in one transaction (logistic_adjust_stock_level, which takes `stock_level.adjust`). Raises
 * 42501 without it, and 23514 (check_violation) when on_hand would go below zero.
 */
export async function adjustStockLevel(
  supabase: SupabaseClient,
  adjustment: {
    stockLevelId: number;
    delta: number;
    reason: StockAdjustmentReason;
    note: string | null;
  }
): Promise<QueryResult<null>> {
  const { error } = await supabase.rpc('logistic_adjust_stock_level', {
    p_stock_level_id: adjustment.stockLevelId,
    p_delta: adjustment.delta,
    p_reason: adjustment.reason,
    p_note: adjustment.note,
  });
  if (error) return { data: null, error };
  return { data: null, error: null };
}
