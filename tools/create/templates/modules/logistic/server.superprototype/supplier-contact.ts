import type { SupabaseClient } from '@supabase/supabase-js';
import type { SupplierContact } from '@sveltebuilder/logistic';
import type { QueryResult } from '$lib/server/postgrest';

/** A new contact for a supplier. */
export type SupplierContactFields = Pick<SupplierContact, 'role' | 'name' | 'email' | 'phone'>;

export async function addSupplierContact(
  supabase: SupabaseClient,
  supplierId: number,
  fields: SupplierContactFields
): Promise<QueryResult<null>> {
  const { error } = await supabase.from('supplier_contact').insert({
    supplier_id: supplierId,
    role: fields.role,
    name: fields.name,
    email: fields.email,
    phone: fields.phone,
  });
  if (error) return { data: null, error };
  return { data: null, error: null };
}

/**
 * Scoped to the supplier as well as the contact id: without it, a crafted form post could
 * delete a contact belonging to a different supplier. RLS permits the delete for any admin,
 * so narrowing it is the caller's job, and this function does it for every caller.
 */
export async function deleteSupplierContact(
  supabase: SupabaseClient,
  supplierId: number,
  id: number
): Promise<QueryResult<null>> {
  const { error } = await supabase
    .from('supplier_contact')
    .delete()
    .eq('id', id)
    .eq('supplier_id', supplierId);
  if (error) return { data: null, error };
  return { data: null, error: null };
}
