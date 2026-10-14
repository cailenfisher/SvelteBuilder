import type { SupabaseClient } from '@supabase/supabase-js';
import type { Supplier } from '@sveltebuilder/logistic';
import type { EntityOption, SupplierWithContacts } from '@sveltebuilder/logistic/views';
import type { QueryResult } from '$lib/server/postgrest';

/** A supplier as an administrator edits it. Its name is copy, edited through local text. */
export type SupplierFields = Pick<Supplier, 'slug' | 'leadTimeDay' | 'active'>;

const selectSupplier = (supabase: SupabaseClient) =>
  supabase
    .from('supplier')
    .select(
      'id, slug, lead_time_day, active, created_at, supplier_contact(id, supplier_id, role, name, email, phone, created_at)'
    );

type SupplierRecord = NonNullable<Awaited<ReturnType<typeof selectSupplier>>['data']>[number];

const toSupplierWithContacts = (row: SupplierRecord): SupplierWithContacts => ({
  id: row.id,
  slug: row.slug,
  leadTimeDay: row.lead_time_day,
  active: row.active,
  createdAt: row.created_at,
  // supplier_contact is a to-many embed, so it genuinely is an array, unlike a to-one embed,
  // where toOne() undoes supabase-js's blanket array typing.
  contacts: (row.supplier_contact ?? []).map((contact) => ({
    id: contact.id,
    supplierId: contact.supplier_id,
    role: contact.role,
    name: contact.name,
    email: contact.email,
    phone: contact.phone,
    createdAt: contact.created_at,
  })),
});

export async function listSupplier(
  supabase: SupabaseClient
): Promise<QueryResult<SupplierWithContacts[]>> {
  const { data, error } = await selectSupplier(supabase).order('slug');
  if (error) return { data: null, error };
  return { data: data.map(toSupplierWithContacts), error: null };
}

/** Null also covers "RLS refused the row": a caller who may not read it should not learn it exists. */
export async function getSupplier(
  supabase: SupabaseClient,
  id: number
): Promise<QueryResult<SupplierWithContacts | null>> {
  const { data, error } = await selectSupplier(supabase).eq('id', id).maybeSingle();
  if (error) return { data: null, error };
  return { data: data ? toSupplierWithContacts(data) : null, error: null };
}

/** Active suppliers, for a select. */
export async function listSupplierOption(
  supabase: SupabaseClient
): Promise<QueryResult<EntityOption[]>> {
  const { data, error } = await supabase
    .from('supplier')
    .select('id, slug')
    .eq('active', true)
    .order('slug');
  if (error) return { data: null, error };
  return { data: data.map((row) => ({ id: row.id, slug: row.slug })), error: null };
}

/**
 * Three statements (the supplier, its local_text_link, its local_text), so an RPC. It is
 * SECURITY INVOKER, so RLS still checks each one; see
 * supabase/supplemental/05-logistic-supplements.sql. Returns the new supplier's id.
 *
 * The name is captured in one locale; other locales are added through the local-text admin
 * screens the base scaffold ships.
 */
export async function createSupplier(
  supabase: SupabaseClient,
  fields: Pick<Supplier, 'slug' | 'leadTimeDay'> & { name: string; localeId: number }
): Promise<QueryResult<number | null>> {
  const { data, error } = await supabase.rpc('logistic_create_supplier', {
    p_slug: fields.slug,
    p_name: fields.name,
    p_locale_id: fields.localeId,
    p_lead_time_day: fields.leadTimeDay,
  });
  if (error) return { data: null, error };
  return { data: data as number | null, error: null };
}

export async function updateSupplier(
  supabase: SupabaseClient,
  id: number,
  fields: SupplierFields
): Promise<QueryResult<null>> {
  const { error } = await supabase
    .from('supplier')
    .update({ slug: fields.slug, lead_time_day: fields.leadTimeDay, active: fields.active })
    .eq('id', id);
  if (error) return { data: null, error };
  return { data: null, error: null };
}
