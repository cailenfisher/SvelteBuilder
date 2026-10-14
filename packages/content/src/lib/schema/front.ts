import { pgTable, bigint, boolean, index, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { section } from './section.js';
import type { FrontSlotWithArticle } from './front-slot.js';
import type { SectionWithCopy } from './section.js';

export const front = pgTable(
  'front',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    sectionId: bigint('section_id', { mode: 'number' }).references(() => section.id, {
      onDelete: 'cascade',
    }),
    slug: text('slug').notNull().unique(),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('uq_front_section_id').on(table.sectionId),
    index('idx_front_section').on(table.sectionId),
  ]
);

export type Front = typeof front.$inferSelect;

export type FrontWithSlots = Front & {
  name: string;
  slots: FrontSlotWithArticle[];
  section: SectionWithCopy | null;
};
