import { pgTable, bigint, boolean, index, integer, text, timestamp } from 'drizzle-orm/pg-core';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';

export const section = pgTable(
  'section',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    parentSectionId: bigint('parent_section_id', { mode: 'number' }).references(
      (): AnyPgColumn => section.id,
      { onDelete: 'set null' }
    ),
    slug: text('slug').notNull().unique(),
    position: integer('position').notNull().default(0),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_section_parent').on(table.parentSectionId),
    index('idx_section_position').on(table.position),
  ]
);

export type Section = typeof section.$inferSelect;

export type SectionWithCopy = Section & {
  name: string;
  description: string;
  children: SectionWithCopy[];
};
