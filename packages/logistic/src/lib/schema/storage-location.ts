import { pgEnum, pgTable, bigint, boolean, index, integer, text, timestamp } from 'drizzle-orm/pg-core';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import { STORAGE_LOCATION_TYPES } from './storage-location-type.js';

export const storageLocationType = pgEnum('storage_location_type', STORAGE_LOCATION_TYPES);

export const storageLocation = pgTable(
  'storage_location',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    slug: text('slug').notNull().unique(),
    locationType: storageLocationType('location_type').notNull(),
    // Self-referential FK
    parentStorageLocationId: bigint('parent_storage_location_id', { mode: 'number' }).references(
      (): AnyPgColumn => storageLocation.id,
      { onDelete: 'set null' },
    ),
    active: boolean('active').notNull().default(true),
    position: integer('position').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_storage_location_parent').on(table.parentStorageLocationId),
    index('idx_storage_location_type').on(table.locationType),
  ],
);

export type StorageLocation = typeof storageLocation.$inferSelect;

export type StorageLocationWithCopy = StorageLocation & {
  name: string;
  ancestors: StorageLocationWithCopy[];
};
