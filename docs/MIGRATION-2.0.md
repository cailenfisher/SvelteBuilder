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

### Copy slugs

Every slug a screen or component renders was renamed to its full, singular concept name, and the
`nav` abbreviation became `navigation`. Rename the rows in place, so the copy you have edited keeps
its text. Run this **before** re-applying the 2.0 seeds: once a seed has inserted a new slug, renaming
the old row to it violates the unique constraint. Each statement only touches rows that exist, so run
the whole block whichever modules you have.

```sql
begin;

-- base
update public.local_text_link l set slug = v.new_slug
from (values
  ('admin.nav.dashboard',       'admin.navigation.dashboard'),
  ('admin.nav.label',           'admin.navigation.label'),
  ('admin.nav.local_text',      'admin.navigation.local_text'),
  ('admin.nav.locale',          'admin.navigation.locale'),
  ('admin.nav.navigation_item', 'admin.navigation.navigation_item'),
  ('nav.back',                  'navigation.back'),
  ('nav.close',                 'navigation.close'),
  ('nav.home',                  'navigation.home'),
  ('nav.menu',                  'navigation.menu'),
  ('nav.pagination',            'navigation.pagination'),
  ('nav.search',                'navigation.search')
) as v(old_slug, new_slug)
where l.slug = v.old_slug and l.scope is null and l.entity_id is null;

-- logistic
update public.local_text_link l set slug = v.new_slug
from (values
  ('logistic.admin.dashboard.title',          'logistic.dashboard.title'),
  ('logistic.admin.nav.cycle_count',          'logistic.admin.navigation.cycle_count'),
  ('logistic.admin.nav.inbound_receipt',      'logistic.admin.navigation.inbound_receipt'),
  ('logistic.admin.nav.pick_task',            'logistic.admin.navigation.pick_task'),
  ('logistic.admin.nav.return_authorization', 'logistic.admin.navigation.return_authorization'),
  ('logistic.admin.nav.shipment',             'logistic.admin.navigation.shipment'),
  ('logistic.admin.nav.stock_level',          'logistic.admin.navigation.stock_level'),
  ('logistic.admin.nav.storage_location',     'logistic.admin.navigation.storage_location'),
  ('logistic.admin.nav.supplier',             'logistic.admin.navigation.supplier'),
  ('logistic.count.approval_note',            'logistic.warehouse.cycle_count.approval_note'),
  ('logistic.count.counted_quantity',         'logistic.warehouse.cycle_count.counted_quantity'),
  ('logistic.count.empty',                    'logistic.warehouse.cycle_count.empty'),
  ('logistic.count.lines',                    'logistic.warehouse.cycle_count.lines'),
  ('logistic.count.mine',                     'logistic.warehouse.cycle_count.mine'),
  ('logistic.count.open',                     'logistic.warehouse.cycle_count.open'),
  ('logistic.count.record',                   'logistic.warehouse.cycle_count.record'),
  ('logistic.count.take',                     'logistic.warehouse.cycle_count.take'),
  ('logistic.dashboard.open_picks',           'logistic.dashboard.open_pick_task'),
  ('logistic.dashboard.open_returns',         'logistic.dashboard.open_return_authorization'),
  ('logistic.dashboard.pending_receipts',     'logistic.dashboard.pending_inbound_receipt'),
  ('logistic.field.location',                 'logistic.field.storage_location'),
  ('logistic.field.location_type',            'logistic.field.storage_location_type'),
  ('logistic.location_type.aisle',            'logistic.storage_location_type.aisle'),
  ('logistic.location_type.bin',              'logistic.storage_location_type.bin'),
  ('logistic.location_type.warehouse',        'logistic.storage_location_type.warehouse'),
  ('logistic.location_type.zone',             'logistic.storage_location_type.zone'),
  ('logistic.pick.complete',                  'logistic.warehouse.pick_task.complete'),
  ('logistic.pick.complete_confirm',          'logistic.warehouse.pick_task.complete_confirm'),
  ('logistic.pick.complete_short',            'logistic.warehouse.pick_task.complete_short'),
  ('logistic.pick.empty',                     'logistic.warehouse.pick_task.empty'),
  ('logistic.pick.mine',                      'logistic.warehouse.pick_task.mine'),
  ('logistic.pick.open',                      'logistic.warehouse.pick_task.open'),
  ('logistic.pick.picked_of',                 'logistic.warehouse.pick_task.picked_of'),
  ('logistic.pick.quantity',                  'logistic.warehouse.pick_task.quantity'),
  ('logistic.pick.record',                    'logistic.warehouse.pick_task.record'),
  ('logistic.pick.remaining',                 'logistic.warehouse.pick_task.remaining'),
  ('logistic.pick.showing',                   'logistic.warehouse.pick_task.showing'),
  ('logistic.pick.take',                      'logistic.warehouse.pick_task.take'),
  ('logistic.pick.task',                      'logistic.pick_task.one'),
  ('logistic.receipt.create',                 'logistic.inbound_receipt.create'),
  ('logistic.receipt.discrepancy',            'logistic.inbound_receipt.discrepancy'),
  ('logistic.receipt.empty',                  'logistic.inbound_receipt.empty'),
  ('logistic.receipt.expected_at',            'logistic.inbound_receipt.expected_at'),
  ('logistic.receipt.expected_quantity',      'logistic.inbound_receipt.expected_quantity'),
  ('logistic.receipt.filter_all',             'logistic.inbound_receipt.filter_all'),
  ('logistic.receipt.filter_status',          'logistic.inbound_receipt.filter_status'),
  ('logistic.receipt.line_add',               'logistic.inbound_receipt.line_add'),
  ('logistic.receipt.lines',                  'logistic.inbound_receipt.lines'),
  ('logistic.receipt.lines_empty',            'logistic.inbound_receipt.lines_empty'),
  ('logistic.receipt.new',                    'logistic.inbound_receipt.new'),
  ('logistic.receipt.one',                    'logistic.inbound_receipt.one'),
  ('logistic.receipt.pagination',             'logistic.inbound_receipt.pagination'),
  ('logistic.receipt.receive',                'logistic.inbound_receipt.receive'),
  ('logistic.receipt.received_at',            'logistic.inbound_receipt.received_at'),
  ('logistic.receipt.received_quantity',      'logistic.inbound_receipt.received_quantity'),
  ('logistic.receipt.supplier',               'logistic.inbound_receipt.supplier'),
  ('logistic.receipt.title',                  'logistic.inbound_receipt.title'),
  ('logistic.receive.active',                 'logistic.warehouse.inbound_receipt.active'),
  ('logistic.receive.discrepancy_note',       'logistic.warehouse.inbound_receipt.discrepancy_note'),
  ('logistic.receive.empty',                  'logistic.warehouse.inbound_receipt.empty'),
  ('logistic.receive.outstanding',            'logistic.warehouse.inbound_receipt.outstanding'),
  ('logistic.receive.received_of',            'logistic.warehouse.inbound_receipt.received_of'),
  ('logistic.receive.recent',                 'logistic.warehouse.inbound_receipt.recent'),
  ('logistic.return.condition',               'logistic.return_authorization.condition'),
  ('logistic.return.condition.damaged',       'logistic.return_authorization.condition.damaged'),
  ('logistic.return.condition.defective',     'logistic.return_authorization.condition.defective'),
  ('logistic.return.condition.salable',       'logistic.return_authorization.condition.salable'),
  ('logistic.return.condition.wrong_item',    'logistic.return_authorization.condition.wrong_item'),
  ('logistic.return.create',                  'logistic.return_authorization.create'),
  ('logistic.return.created_at',              'logistic.return_authorization.created_at'),
  ('logistic.return.disposition',             'logistic.return_authorization.disposition'),
  ('logistic.return.disposition.quarantine',  'logistic.return_authorization.disposition.quarantine'),
  ('logistic.return.disposition.refurbish',   'logistic.return_authorization.disposition.refurbish'),
  ('logistic.return.disposition.restock',     'logistic.return_authorization.disposition.restock'),
  ('logistic.return.disposition.scrap',       'logistic.return_authorization.disposition.scrap'),
  ('logistic.return.empty',                   'logistic.return_authorization.empty'),
  ('logistic.return.expected_quantity',       'logistic.return_authorization.expected_quantity'),
  ('logistic.return.filter_all',              'logistic.return_authorization.filter_all'),
  ('logistic.return.filter_status',           'logistic.return_authorization.filter_status'),
  ('logistic.return.grade',                   'logistic.return_authorization.grade'),
  ('logistic.return.lines',                   'logistic.return_authorization.lines'),
  ('logistic.return.lines_empty',             'logistic.return_authorization.lines_empty'),
  ('logistic.return.new',                     'logistic.return_authorization.new'),
  ('logistic.return.no_location',             'logistic.return_authorization.no_location'),
  ('logistic.return.one',                     'logistic.return_authorization.one'),
  ('logistic.return.process',                 'logistic.return_authorization.process'),
  ('logistic.return.process_confirm',         'logistic.return_authorization.process_confirm'),
  ('logistic.return.reason',                  'logistic.return_authorization.reason'),
  ('logistic.return.received_quantity',       'logistic.return_authorization.received_quantity'),
  ('logistic.return.status_label',            'logistic.return_authorization.status_label'),
  ('logistic.return.title',                   'logistic.return_authorization.title'),
  ('logistic.stock.adjust',                   'logistic.stock_level.adjust'),
  ('logistic.stock.adjust_apply',             'logistic.stock_level.adjust_apply'),
  ('logistic.stock.adjust_delta',             'logistic.stock_level.adjust_delta'),
  ('logistic.stock.adjust_title',             'logistic.stock_level.adjust_title'),
  ('logistic.stock.empty',                    'logistic.stock_level.empty'),
  ('logistic.stock.empty_low',                'logistic.stock_level.empty_low'),
  ('logistic.stock.filter_all',               'logistic.stock_level.filter_all'),
  ('logistic.stock.filter_low',               'logistic.stock_level.filter_low'),
  ('logistic.stock.filters',                  'logistic.stock_level.filters'),
  ('logistic.stock.history',                  'logistic.stock_level.history'),
  ('logistic.stock.history_after',            'logistic.stock_level.history_after'),
  ('logistic.stock.history_empty',            'logistic.stock_level.history_empty'),
  ('logistic.stock.reorder_point_hint',       'logistic.stock_level.reorder_point_hint'),
  ('logistic.stock.title',                    'logistic.stock_level.title'),
  ('logistic.warehouse.count',                'logistic.warehouse.cycle_count.title'),
  ('logistic.warehouse.count.hint',           'logistic.warehouse.cycle_count.hint'),
  ('logistic.warehouse.nav',                  'logistic.warehouse.navigation'),
  ('logistic.warehouse.pick',                 'logistic.warehouse.pick_task.title'),
  ('logistic.warehouse.pick.hint',            'logistic.warehouse.pick_task.hint'),
  ('logistic.warehouse.receive',              'logistic.warehouse.inbound_receipt.title'),
  ('logistic.warehouse.receive.hint',         'logistic.warehouse.inbound_receipt.hint')
) as v(old_slug, new_slug)
where l.slug = v.old_slug and l.scope = 'logistic' and l.entity_id is null;

-- content
update public.local_text_link l set slug = v.new_slug
from (values
  ('action.approve',                'content.article_workflow.approve'),
  ('action.publish',                'content.article_workflow.publish'),
  ('action.send_back',              'content.article_workflow.send_back'),
  ('action.submit_for_review',      'content.article_workflow.submit_for_review'),
  ('action.unpublish',              'content.article_workflow.unpublish'),
  ('content.admin.articles',        'content.article_admin.article'),
  ('content.admin.block_text',      'content.article_admin.block_text'),
  ('content.admin.block_type',      'content.article_admin.block_type'),
  ('content.admin.body',            'content.article_admin.body'),
  ('content.admin.body_empty',      'content.article_admin.body_empty'),
  ('content.admin.bylines',         'content.article_admin.article_byline'),
  ('content.admin.checklist',       'content.article_admin.checklist'),
  ('content.admin.create',          'content.article_admin.create'),
  ('content.admin.created',         'content.article_admin.created'),
  ('content.admin.empty',           'content.article_admin.empty'),
  ('content.admin.filing',          'content.article_admin.filing'),
  ('content.admin.filter_all',      'content.article_admin.filter_all'),
  ('content.admin.filter_status',   'content.article_admin.filter_status'),
  ('content.admin.headline',        'content.article_admin.headline'),
  ('content.admin.new',             'content.article_admin.new'),
  ('content.admin.publish_blocked', 'content.article_admin.publish_blocked'),
  ('content.admin.required',        'content.article_admin.required'),
  ('content.admin.sections',        'content.article_admin.section'),
  ('content.admin.slug',            'content.article_admin.slug'),
  ('content.admin.status',          'content.article_admin.status'),
  ('content.admin.workflow',        'content.article_admin.workflow'),
  ('content.comments.body',         'content.comment.body'),
  ('content.comments.email',        'content.comment.email'),
  ('content.comments.heading',      'content.comment.heading'),
  ('content.comments.leave',        'content.comment.leave'),
  ('content.comments.name',         'content.comment.name'),
  ('content.comments.pending',      'content.comment.pending'),
  ('content.comments.submit',       'content.comment.submit'),
  ('content.preview.banner',        'content.article_preview.banner'),
  ('content.preview.title_prefix',  'content.article_preview.title_prefix'),
  ('newsletter.email_label',        'content.newsletter_subscription_form.email_label'),
  ('newsletter.email_placeholder',  'content.newsletter_subscription_form.email_placeholder'),
  ('newsletter.error_message',      'content.newsletter_subscription_form.error_message'),
  ('newsletter.signup_description', 'content.newsletter_subscription_form.signup_description'),
  ('newsletter.signup_heading',     'content.newsletter_subscription_form.signup_heading'),
  ('newsletter.submit_label',       'content.newsletter_subscription_form.submit_label'),
  ('newsletter.success_message',    'content.newsletter_subscription_form.success_message')
) as v(old_slug, new_slug)
where l.slug = v.old_slug and l.scope = 'content' and l.entity_id is null;

commit;
```

Some slugs are no longer rendered at all: the base dashboard's placeholder statistics, the article
admin screens' own table and workflow labels (the screens now render content's `ArticleList`,
`ArticleWorkflowPanel` and `ArticleBlockEditor`, which bring their own), and the workflow panel's
drawer, assignment tab and per-status buttons. The 2.0 seeds no longer create them. Leaving the rows
in place is harmless; to remove them, run this after the renames:

```sql
begin;

create temporary table retired_link on commit drop as
select id from public.local_text_link
where entity_id is null and (
  (scope is null and slug in (
    'admin.dashboard.recent.title', 'admin.stats.key_metrics',
    'admin.dashboard.stat.total_users', 'admin.dashboard.stat.active_sessions',
    'admin.dashboard.stat.published', 'admin.dashboard.stat.pending_review'))
  or (scope = 'content' and slug in (
    'content.article_admin.empty', 'content.article_admin.status', 'content.article_admin.created',
    'content.article_admin.body_empty', 'content.article_admin.block_type',
    'content.article_admin.block_text', 'content.article_admin.workflow',
    'content.article_admin.checklist', 'content.article_admin.required',
    'content.article_admin.publish_blocked',
    'content.article_list.author', 'content.article_list.section', 'content.article_list.published_at',
    'content.article_workflow.submit_for_review', 'content.article_workflow.approve',
    'content.article_workflow.send_back', 'content.article_workflow.publish',
    'content.article_workflow.unpublish', 'content.article_workflow.close',
    'content.article_workflow.current', 'content.article_workflow.assignment',
    'content.article_workflow.assignment_empty'))
);

-- local_text references its link with on delete restrict, so the copy goes first.
delete from public.local_text where link in (select id from retired_link);
delete from public.local_text_link where id in (select id from retired_link);

commit;
```

---

## Stylesheets

coreui, content and logistic components no longer carry Svelte `<style>` blocks. Every style is in a
plain stylesheet the app imports, so an app that does not import a package's stylesheet renders its
components unstyled.

1. In `src/app.css`, after coreui's import, add one line per module you use, then the utilities
   layer:

   ```css
   @import '@sveltebuilder/coreui/styles/components.css' layer(components);
   @import '@sveltebuilder/content/styles/components.css' layer(components);
   @import '@sveltebuilder/logistic/styles/components.css' layer(components);
   @import './utilities.css' layer(utilities);
   ```

   Copy `src/utilities.css` from a freshly scaffolded project; it holds `.visually-hidden`, which
   replaces the `.sr-only` copies the base admin screens each defined.
2. coreui's table styles now target `.table-row`, `.table-cell` and `.table-header-cell` rather
   than `tr`, `td` and `th`. A row or cell written as a plain element inside `TableBody` loses
   its borders and padding; use `TableRow`, `TableCell` and `TableHeaderCell`.
3. Module components' styles moved from unlayered (Svelte-scoped) to the `components` layer.
   Your own unlayered CSS now overrides them without a specificity fight; a rule of yours that
   only won before because it was more specific still wins.

Your existing screens keep working: their `<style>` blocks are still yours. A screen you take from
a 2.0 scaffold has its stylesheet beside it, and its root class renamed after its view type
(`.receipt-list` → `.inbound-receipt-list-screen`); the full list is in
`docs/conformance-manifest.md`, "Added during Phase 10".

