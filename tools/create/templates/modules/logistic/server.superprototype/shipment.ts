import type { SupabaseClient } from '@supabase/supabase-js';
import type { Shipment, ShipmentStatus } from '@sveltebuilder/logistic';
import type { ShipmentDetailView, ShipmentRow } from '@sveltebuilder/logistic/views';
import type { CountedRows, QueryRange, QueryResult } from '$lib/server/postgrest';

/** Shipments newest first, optionally of one status, with the total matching. */
export async function listShipment(
  supabase: SupabaseClient,
  filter: { status: ShipmentStatus | null },
  range: QueryRange
): Promise<QueryResult<CountedRows<ShipmentRow>>> {
  let query = supabase
    .from('shipment')
    .select(
      'id, user_account_id, status, carrier, service_level, tracking_number, shipped_at, delivered_at, created_at, updated_at, shipment_line(count)',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(range.offset, range.offset + range.limit - 1);
  if (filter.status !== null) query = query.eq('status', filter.status);

  const { data, error, count } = await query;
  if (error) return { data: null, error };

  const shipments: ShipmentRow[] = data.map((row) => ({
    id: row.id,
    userAccountId: row.user_account_id,
    status: row.status,
    carrier: row.carrier,
    serviceLevel: row.service_level,
    trackingNumber: row.tracking_number,
    shippedAt: row.shipped_at,
    deliveredAt: row.delivered_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    // An aggregate embed arrives as a one-element array of { count }. A list shows how many
    // lines a shipment has, not what they are.
    lineCount: row.shipment_line?.[0]?.count ?? 0,
  }));
  return { data: { rows: shipments, total: count ?? shipments.length }, error: null };
}

/**
 * A shipment with its lines and tracking events, events newest first. They are sorted here
 * rather than in the query: a carrier's own event order is not dependable and the embed has no
 * ordering of its own to rely on.
 */
export async function getShipment(
  supabase: SupabaseClient,
  id: number
): Promise<QueryResult<ShipmentDetailView['shipment'] | null>> {
  const { data: row, error } = await supabase
    .from('shipment')
    .select(
      'id, user_account_id, status, carrier, service_level, tracking_number, shipped_at, delivered_at, created_at, updated_at, shipment_line(id, shipment_id, pick_task_line_id, sku, quantity, created_at), tracking_event(id, shipment_id, status, event_location, description, occurred_at, created_at)'
    )
    .eq('id', id)
    .maybeSingle();
  if (error) return { data: null, error };
  if (row === null) return { data: null, error: null };

  return {
    data: {
      id: row.id,
      userAccountId: row.user_account_id,
      status: row.status,
      carrier: row.carrier,
      serviceLevel: row.service_level,
      trackingNumber: row.tracking_number,
      shippedAt: row.shipped_at,
      deliveredAt: row.delivered_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lines: (row.shipment_line ?? []).map((line) => ({
        id: line.id,
        shipmentId: line.shipment_id,
        pickTaskLineId: line.pick_task_line_id,
        sku: line.sku,
        quantity: line.quantity,
        createdAt: line.created_at,
      })),
      trackingEvents: (row.tracking_event ?? [])
        .map((event) => ({
          id: event.id,
          shipmentId: event.shipment_id,
          status: event.status,
          eventLocation: event.event_location,
          description: event.description,
          occurredAt: event.occurred_at,
          createdAt: event.created_at,
        }))
        .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)),
    },
    error: null,
  };
}

/**
 * Two statements (the shipment and its lines), and the detail screen offers no way to add a
 * line afterwards, so a shipment created without one would be stranded. Hence an RPC. It is
 * SECURITY INVOKER, so RLS still checks both inserts. Returns the new shipment's id.
 */
export async function createShipment(
  supabase: SupabaseClient,
  fields: Pick<Shipment, 'userAccountId' | 'carrier' | 'serviceLevel'> & {
    skus: string[];
    quantities: number[];
  }
): Promise<QueryResult<number | null>> {
  const { data, error } = await supabase.rpc('logistic_create_shipment', {
    p_user_account_id: fields.userAccountId,
    p_skus: fields.skus,
    p_quantities: fields.quantities,
    p_carrier: fields.carrier,
    p_service_level: fields.serviceLevel,
  });
  if (error) return { data: null, error };
  return { data: data as number | null, error: null };
}

/**
 * shipped_at and delivered_at are stamped when the shipment reaches those states and cleared
 * when it leaves them, so a correction does not leave a delivery date on a shipment that is
 * back in transit.
 */
export async function updateShipmentStatus(
  supabase: SupabaseClient,
  id: number,
  status: ShipmentStatus
): Promise<QueryResult<null>> {
  const { error } = await supabase
    .from('shipment')
    .update({
      status,
      shipped_at: status === 'dispatched' ? new Date().toISOString() : null,
      delivered_at: status === 'delivered' ? new Date().toISOString() : null,
    })
    .eq('id', id);
  if (error) return { data: null, error };
  return { data: null, error: null };
}

export async function updateShipmentTracking(
  supabase: SupabaseClient,
  id: number,
  fields: Pick<Shipment, 'carrier' | 'serviceLevel' | 'trackingNumber'>
): Promise<QueryResult<null>> {
  const { error } = await supabase
    .from('shipment')
    .update({
      carrier: fields.carrier,
      service_level: fields.serviceLevel,
      tracking_number: fields.trackingNumber,
    })
    .eq('id', id);
  if (error) return { data: null, error };
  return { data: null, error: null };
}
