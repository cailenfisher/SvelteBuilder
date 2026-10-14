# MIGRATION-2.0.md — upgrading to coreui 1.0, content 2.0 and logistic 2.0

**Draft.** Written phase by phase as the conformance plan (`docs/CONFORMANCE-PLAN.md`) renames
things, and completed in Phase 13. The SQL below has not yet been run against a database built from
the 1.x schema; Phase 13 validates it before release.

Screens are scaffolded once and owned by your app (`CLAUDE.md`, guardrail 10), so an existing
project receives none of these changes on upgrade. This guide is how to apply them.

---

## Database

A project scaffolded before 2.0 has the old names in its database. Run the following once, in a
single transaction, **before** regenerating migrations with `sveltebuilder sync:supabase` and
before deploying code that expects the new names. Then re-apply every file in
`supabase/supplemental/`, which recreates the functions and policies whose bodies name the renamed
columns.

Run only the sections for the modules your project includes.

### Base scaffold

```sql
begin;

alter table public.navigation_item rename column scope to menu;
alter table public.navigation_item rename column sort_order to position;
alter index public.uq_navigation_item_href_scope rename to uq_navigation_item_href_menu;
alter table public.navigation_item
  alter column created_at type timestamptz using created_at at time zone 'UTC',
  alter column updated_at type timestamptz using updated_at at time zone 'UTC';

alter table public.local_text
  alter column created_at type timestamptz using created_at at time zone 'UTC',
  alter column updated_at type timestamptz using updated_at at time zone 'UTC';

-- The RPC's parameters were renamed (p_scope → p_menu, p_sort_order → p_position). Postgres
-- cannot rename a parameter in place, so drop it; re-applying 04-admin-write-rpc.sql recreates it.
drop function if exists public.create_navigation_item(text, text, text, integer);

update public.local_text_link set slug = 'admin.navigation_item.menu'
  where slug = 'admin.navigation_item.scope' and scope is null and entity_id is null;
update public.local_text_link set slug = 'admin.navigation_item.position'
  where slug = 'admin.navigation_item.sort_order' and scope is null and entity_id is null;

commit;
```

The two renamed labels also changed text ("Menu", "Position"). Edit them at `/admin/local-text`,
or leave your own wording.

### Logistic

```sql
begin;

alter type public.adjustment_reason rename to stock_adjustment_reason;
alter type public.inbound_receipt_status rename value 'complete' to 'completed';
alter type public.cycle_count_status rename value 'complete' to 'completed';

alter table public.storage_location rename column sort_order to position;

-- Points in time are timestamptz everywhere. Existing values were written as UTC.
alter table public.cycle_count_line
  alter column created_at type timestamptz using created_at at time zone 'UTC';
alter table public.cycle_count
  alter column created_at type timestamptz using created_at at time zone 'UTC',
  alter column updated_at type timestamptz using updated_at at time zone 'UTC';
alter table public.inbound_receipt_line
  alter column created_at type timestamptz using created_at at time zone 'UTC';
alter table public.inbound_receipt
  alter column expected_at type timestamptz using expected_at at time zone 'UTC',
  alter column received_at type timestamptz using received_at at time zone 'UTC',
  alter column created_at type timestamptz using created_at at time zone 'UTC',
  alter column updated_at type timestamptz using updated_at at time zone 'UTC';
alter table public.pick_task_line
  alter column created_at type timestamptz using created_at at time zone 'UTC';
alter table public.pick_task
  alter column created_at type timestamptz using created_at at time zone 'UTC',
  alter column updated_at type timestamptz using updated_at at time zone 'UTC';
alter table public.return_authorization_line
  alter column created_at type timestamptz using created_at at time zone 'UTC';
alter table public.return_authorization
  alter column created_at type timestamptz using created_at at time zone 'UTC',
  alter column updated_at type timestamptz using updated_at at time zone 'UTC';
alter table public.shipment_line
  alter column created_at type timestamptz using created_at at time zone 'UTC';
alter table public.shipment
  alter column shipped_at type timestamptz using shipped_at at time zone 'UTC',
  alter column delivered_at type timestamptz using delivered_at at time zone 'UTC',
  alter column created_at type timestamptz using created_at at time zone 'UTC',
  alter column updated_at type timestamptz using updated_at at time zone 'UTC';
alter table public.stock_adjustment
  alter column created_at type timestamptz using created_at at time zone 'UTC';
alter table public.stock_level
  alter column created_at type timestamptz using created_at at time zone 'UTC',
  alter column updated_at type timestamptz using updated_at at time zone 'UTC';
alter table public.storage_location
  alter column created_at type timestamptz using created_at at time zone 'UTC';
alter table public.supplier_contact
  alter column created_at type timestamptz using created_at at time zone 'UTC';
alter table public.supplier
  alter column created_at type timestamptz using created_at at time zone 'UTC';
alter table public.tracking_event
  alter column occurred_at type timestamptz using occurred_at at time zone 'UTC',
  alter column created_at type timestamptz using created_at at time zone 'UTC';

update public.local_text_link
  set slug = replace(slug, 'logistic.adjustment_reason.', 'logistic.stock_adjustment_reason.')
  where scope = 'logistic' and slug like 'logistic.adjustment\_reason.%';
update public.local_text_link set slug = 'logistic.inbound_receipt.status.completed'
  where scope = 'logistic' and slug = 'logistic.inbound_receipt.status.complete';
update public.local_text_link set slug = 'logistic.cycle_count.status.completed'
  where scope = 'logistic' and slug = 'logistic.cycle_count.status.complete';

commit;
```

### Content

```sql
begin;

alter type public.media_type rename to media_asset_type;
alter type public.media_license rename to media_asset_license;

alter table public.media_asset rename column uploaded_by to user_account_id;
alter index public.idx_media_asset_uploader rename to idx_media_asset_user_account;
alter table public.media_asset
  rename constraint fk_media_asset_uploaded_by to fk_media_asset_user_account;

alter table public.article rename column allow_comment to comment_allowed;
alter table public.article rename column embargo_until to embargo_expires_at;
alter table public.front_slot rename column pinned_until to pin_expires_at;
alter index public.idx_front_slot_pinned rename to idx_front_slot_pin_expires_at;

alter table public.article_status rename column ordinal to position;
alter index public.idx_article_status_ordinal rename to idx_article_status_position;
alter table public.publish_checklist_item rename column ordinal to position;
alter index public.idx_publish_checklist_item_ordinal rename to idx_publish_checklist_item_position;
alter table public.section rename column ordinal to position;
alter index public.idx_section_ordinal rename to idx_section_position;

-- A subscriber's language becomes a reference to a locale row. Codes the project does not have
-- fall back to English, as the subscribe RPC now does.
alter table public.subscriber add column locale_id bigint;
update public.subscriber s
  set locale_id = coalesce(
    (select id from public.locale where code = s.locale),
    (select id from public.locale where code = 'en')
  );
alter table public.subscriber alter column locale_id set not null;
alter table public.subscriber drop column locale;
alter table public.subscriber
  add constraint fk_subscriber_locale
  foreign key (locale_id) references public.locale(id) on delete restrict;

commit;
```
