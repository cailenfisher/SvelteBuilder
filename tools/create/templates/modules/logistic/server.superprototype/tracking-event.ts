import type { SupabaseClient } from '@supabase/supabase-js';
import type { TrackingEvent } from '@sveltebuilder/logistic';
import type { QueryResult } from '$lib/server/postgrest';

/**
 * Records a carrier scan against a shipment. tracking_event.status is free text, not the
 * shipment enum: it records what a carrier called the scan, which no enum of ours can
 * enumerate.
 */
export async function addTrackingEvent(
  supabase: SupabaseClient,
  fields: Pick<TrackingEvent, 'shipmentId' | 'status' | 'eventLocation' | 'description'>
): Promise<QueryResult<null>> {
  const { error } = await supabase.from('tracking_event').insert({
    shipment_id: fields.shipmentId,
    status: fields.status,
    event_location: fields.eventLocation,
    description: fields.description,
  });
  if (error) return { data: null, error };
  return { data: null, error: null };
}
