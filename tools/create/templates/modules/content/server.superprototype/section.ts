import type { SupabaseClient } from '@supabase/supabase-js';
import type { Section } from '@sveltebuilder/content';
import type { QueryResult } from '$lib/server/postgrest';

const selectSection = (supabase: SupabaseClient) =>
  supabase.from('section').select('id, parent_section_id, slug, position, active, created_at');

type SectionRecord = NonNullable<Awaited<ReturnType<typeof selectSection>>['data']>[number];

const toSection = (row: SectionRecord): Section => ({
  id: row.id,
  parentSectionId: row.parent_section_id,
  slug: row.slug,
  position: row.position,
  active: row.active,
  createdAt: row.created_at,
});

export async function getSectionBySlug(
  supabase: SupabaseClient,
  slug: string
): Promise<QueryResult<Section | null>> {
  const { data, error } = await selectSection(supabase).eq('slug', slug).maybeSingle();
  if (error) return { data: null, error };
  return { data: data ? toSection(data) : null, error: null };
}

/** Active sections, in order; with a parent, only that section's children. */
export async function listActiveSection(
  supabase: SupabaseClient,
  parentSectionId?: number
): Promise<QueryResult<Section[]>> {
  let query = selectSection(supabase).eq('active', true);
  if (parentSectionId !== undefined) query = query.eq('parent_section_id', parentSectionId);
  const { data, error } = await query.order('position');
  if (error) return { data: null, error };
  return { data: data.map(toSection), error: null };
}
