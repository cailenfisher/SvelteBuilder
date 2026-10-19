# MIGRATION-2.0.md — upgrading to coreui 1.0, content 2.0 and logistic 2.0

For the release candidates coreui `1.0.0-rc`, content `2.0.0-rc`, logistic `2.0.0-rc` and the new
`@sveltebuilder/access` `1.0.0-rc`, which brings roles and permissions (see [Access control](#access-control)).

**The SQL is validated** (2026-10-15, and again on 2026-10-18 with access control in it). A
database built from the last 1.x release (`main` at `d194b00`, base plus logistic and content,
migration and seed), upgraded with every block below, given the new access tables and
`navigation_item.permission_scope` as drizzle-kit generates them, then the 2.0
`supabase/supplemental/` files in sync's order and the seed twice, passes every `pnpm sql:check`
assertion, access control's included. Its schema matches a fresh 2.0 database except for one
column's position (`subscriber.locale_id` is added last rather than in place, which nothing depends
on), its grants are identical, and so is its set of copy links; fifteen of them keep their 1.x
wording, because a seed never overwrites copy you may have edited.

> [!WARNING]
> **Regenerating migrations is not validated.** `sveltebuilder sync:supabase` diffs drizzle-kit's
> snapshot, not your database, so on a 1.x project it asks whether each renamed enum, column and
> table was renamed or created, and the migration it then writes repeats renames the SQL below has
> already made. Run sync in a terminal: without one it now stops with an error naming the first
> question. Until this is settled, review the generated
> migration by hand before applying it: keep only the statements creating what is new (the access
> tables and `navigation_item.permission_scope`), and drop the ones repeating the renames.

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

-- The workflow role on an assignment, renamed so it no longer reads like an access role (A23).
alter table public.article_assignment rename column role to article_assignment_role;

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

## Access control

2.0 brings roles and permissions (`docs/ACCESS-CONTROL-USAGE.md`). Administrators keep exactly
what they had. Everyone else is authorized by the roles an administrator gives them, which on
upgrade is nobody.

> [!IMPORTANT]
> **With logistic, plan the upgrade with your warehouse staff in mind.** In 1.x any signed-in user
> could read every logistic table and do floor work. In 2.0 someone with no role sees nothing. Have
> the list of who should keep access ready, and give them their role as soon as the migration is
> applied (below).

### Files to bring in

Copy these from a freshly scaffolded 2.0 project (same template and modules) into yours, with the
rest of the 2.0 `supabase/supplemental/` and `supabase/seeds/` files the Database section re-applies.
The base and SuperPrototype files every project gets; the content and logistic ones only with that
module. If you changed any of them, merge rather than overwrite.

| File | What it is |
| --- | --- |
| `package.json`: `@sveltebuilder/access` | the package, at the release's version |
| `.sveltebuilder/registry/@sveltebuilder-access.json` | registers the access tables |
| `.sveltebuilder/registry/@sveltebuilder-content.json`, `@sveltebuilder-logistic.json` | the modules' manifests, now with `access` |
| `src/app.css`: the `@sveltebuilder/access/styles/components.css` line, after coreui's | the access components' styles |
| `supabase/supplemental/01-access.sql` | the core: helpers, admin RPCs, RLS |
| `supabase/supplemental/06-user-account-admin-list.sql` | users with their email, for administrators |
| `supabase/supplemental/02-content-rls.sql`, `03-content-media.sql`, `05-logistic-supplements.sql` | the modules' policies and functions, rewritten |
| `supabase/seeds/01-access.sql`, `00-base-navigation.sql`, `content.sql`, `logistic.sql` | copy, menu entries, the modules' roles |
| `src/lib/server/schema.ts` | `navigation_item.permission_scope` |
| `src/lib/server/`: `permission.ts`, `role.ts`, `role-permission.ts`, `role-assignment.ts`, `user-group.ts`, `user-group-member.ts`, `user-account.ts`, `navigation-item.ts`, `form-error.ts` | data modules |
| `src/lib/server/content/`, `src/lib/server/logistic/` | the modules' data modules: content's article, assignment, sharing and comment modules; logistic's RPC calls no longer pass a user account |
| `src/lib/Role/` | the shared role assignment form |
| `src/routes/(admin)/+layout.server.ts` | admits staff |
| `src/routes/(admin)/admin/`: `role/`, `user-group/`, `user-account/`, `role-assignment-action.ts`, `require-access.ts` | the access screens and the loaders' guards |
| `src/routes/(admin)/admin/*/+page.server.ts` for locale, local-text and navigation-item | administrator-only in their loaders |
| `src/routes/(admin)/admin/content/article/`, `src/routes/(admin)/admin/logistic/`, `src/routes/(warehouse)/` | the module screens, with the reader's actions; the article access panel; the warehouse admitting staff with a warehouse role |

### Sync, apply, give roles

`sveltebuilder sync:supabase` writes `supabase/supplemental/access-generated.sql` from the
manifests and puts it, with the changed supplemental files, into the new migration. The permission
catalog is in that migration, so it reaches a hosted database without the seed; the seed brings the
copy and the modules' roles (Editor, Writer and Contributor for content; Logistics manager and
Warehouse operator for logistic), held by nobody.

Then give your staff their roles: at `/admin/user-account`, open each person and give them a role
everywhere. To restore 1.x logistic access for every existing account at once, which you probably
do not want if signup is open, run this as an administrator in the SQL editor:

```sql
insert into public.role_assignment (role_id, user_account_id)
select r.id, ua.id
from public.role r cross join public.user_account ua
where r.slug = 'logistic_operator' and not ua.admin
on conflict do nothing;
```

### What behaves differently

- **Staff can reach `/admin`.** Anyone holding a role sees the admin area, with only the menu
  entries for scopes they hold. Before, only administrators could. The roles, groups, users,
  locale, copy and navigation screens stay administrator-only.
- **Logistic is staff-only.** A signed-in user with no logistic role reads nothing and cannot
  reach `/warehouse`. Operators read everything and receive, pick, count and grade; managers also
  create, update, delete, adjust stock and approve counts.
- **Logistic's RPCs lost their user account parameter.** `logistic_receive_receipt_line`,
  `_record_picked_quantity`, `_complete_pick_task`, `_grade_return_line`, `_approve_cycle_count`,
  `_create_shipment`, `_create_return_authorization` and `_create_cycle_count` take the actor from
  the session; the old signatures are dropped. The stock primitives (`logistic_adjust_stock`,
  `_reserve_stock`, `_release_stock_reservation`, `_consume_stock`, `_ensure_stock_level`) can no
  longer be called by `anon` or `authenticated`, from the API or from a `security invoker`
  function of your own; adjust stock with `logistic_adjust_stock_level`. A function of yours that
  reserves or moves stock becomes `security definer`, checks the caller with
  `current_user_can(scope, action)` before it writes, and takes the actor from
  `current_user_id()`. Workers no
  longer update lines directly, so a direct `PATCH` of a pick line is refused.
- **Nobody sets an article's status directly**, an administrator included: the status and publish
  date change only through `content_transition_article_status`, so the publish checklist cannot be
  skipped by a direct `PATCH`. Articles are created through `content_create_article`, which makes
  the creator the article's author.
- **A commenter's email address is unreadable through the API**, to everyone.

---

## API changes

What changed beyond a name. Each package's changelog for 1.0 or 2.0 has the same list.

### coreui

- **No English defaults.** Strings that are accessible names are required: `Dialog` and `Drawer`
  `closeLabel`; `ConfirmDialog` `confirmLabel` and `cancelLabel`; `Pagination` `label`,
  `previousLabel` and `nextLabel`; `Spinner` and `ProgressBar` `label`; and `Tag`'s `removeLabel`
  whenever it has `onRemove`. `DataTable` replaces `emptyLabel` with one required `labels` object
  (`empty`, `pagination`, `previousPage`, `nextPage`). `Select`'s `placeholder` is optional with no
  default. `createMessageBus()` requires a complete `labels` object, `DEFAULT_MESSAGE_LABELS` is no
  longer exported, and `InlineNotification` outside a message bus throws instead of showing
  English.
- **Callbacks.** `Tag`'s `onremove` is `onRemove`. Every bindable value has its change callback:
  `onCheckedChange` (`Switch`, `MenuCheckboxItem`), `onValueChange` (`RadioGroup`, `Select`, `Tabs`,
  `Accordion`, `MenuRadioGroup`) and `onOpenChange` (`Dialog`, `Popover`, `Menu`, `ConfirmDialog`).
  `TableHeaderCell` keeps `onSort`, a request to sort with no value.
- **Text.** `MenuSub` takes a `trigger` snippet instead of `triggerLabel`; `Tooltip` takes a
  `trigger` snippet instead of `children`, with `content` still a string.
- **Severity.** The message severity `error` is `danger`, as in `Badge`, `Alert` and the tokens.
- **Moved out.** `BlockEditor` is content's `ArticleBlockEditor`; `LocaleEdit`, `LocalTextEdit` and
  `LocalTextLinkEdit` are the base scaffold's `LocaleFieldset`, `LocalTextFieldset` and
  `LocalTextLinkFieldset`; `BarcodeInput` is logistic's, labelled by a surrounding `Field`.
  `StatusBadge` is removed: use `Badge`.
- **Types.** The variant, size, side and orientation unions are exported (`ButtonVariant`,
  `DrawerSide`, …), with `DataTableLabels` and the screen-contract types `ScreenCopy`,
  `ScreenLocale`, `ScreenPage`, `ScreenFormResult` and `ScreenFormError`. `DataTableColumn.align` is
  `'start' | 'end'`.
- **`useField()` and form-action errors:** see the two sections below.
- **Fixes you may notice.** `DateTimePicker` reads a typed time in its `timezone` prop rather than
  the browser's, updates a bound `value` even with `onValueChange`, and passes `min`/`max` to the
  input in the form it accepts. A disabled `SelectItem` carries `aria-disabled`; `Tooltip` has
  `role="tooltip"`.
- **New.** `CheckboxMatrix`, a grid of checkboxes with row and column headers; `Checkbox` takes
  `readonly`, `aria-labelledby` and `aria-describedby`; the `ScreenAction` screen-contract type.
- **Peers.** `svelte ^5.33.0`; `@internationalized/date` is declared; `diglossia` is an optional
  peer, for the screen-contract types.

### content

- **Copy from the dictionary.** Every component resolves its text from the dictionary in context
  or its `dictionary` prop; the 2.0 seed has it in English and French. `FrontCurationBoard`,
  `ArticleList` and the other list components take `dictionary`; `FrontCurationBoard` no longer
  takes `locale`.
- **`ArticleList`** takes `ArticleRow[]` and an `href` per article, and requires `onPageChange`;
  its columns are headline, status, canonical slug and creation date.
- **`ArticleWorkflowPanel`** is an inline section of plain forms instead of a drawer: it takes
  `statusSlug`, `statuses`, `checklist`, `transitionAction`, `checklistAction` and an optional
  `enhance`, and no longer takes `article`, `assignments`, `open`, `onClose` or the transition
  callbacks.
- **`ArticleBlockEditor`**'s `readonly` mode shows text, with an empty state.
- **`validateArticleForPublish`** returns its issues: see "Form-action errors".
- **Access control.** `ArticleAssignment.role` is `articleAssignmentRole`. `CommentList` takes
  `CommentRow` (a comment without its author's email address), which a `Comment` satisfies. The
  admin views carry the reader's `actions` (`ArticleAdminDetailView.actions`,
  `ArticleAdminListView.articleActions`, required; `ArticleRow.actions`, optional, since the public
  screens share it).
- **Types.** Entity types are inferred from the schema; `Article.leadMediaAssetId` is a required
  `number | null`. `ArticleSection`, `ArticleTopic` and `ArticleTag` are exported;
  `PaginatedResult` is not. The main entry exports the schema as types only.

### logistic

- **Copy from the dictionary**, as in content. `StockLevelBar` and `TrackingEventList` take
  `dictionary`; `PickTaskCard` and `TrackingEventList` require `locale`.
- **`StorageLocationPath`** is a labelled list rather than a `nav` landmark.
- **`BarcodeInput`** is labelled by a surrounding `Field`; its `label` and `error` props are gone.
- **Access control.** The admin views (`SupplierListView` and the other eleven) carry the reader's
  `actions` through coreui's `ScreenAction`. `StockLevelTable`'s `onAdjust` is optional, and
  `SupplierContactList` takes `removable`. The RPC changes are under
  [Access control](#access-control).

### Scaffolded projects

- **Data access** goes through one data module per table in `src/lib/server/` and
  `src/lib/server/<module>/`; route files no longer call `.from()`. Copy them from a fresh scaffold.
- **Stylesheets:** see "Stylesheets" below.
- **Screens** name their copy lookup `localText` (was `t`), and module screens import package
  components where they used to hand-build them (the article admin screens, the stock level,
  receipt and shipment screens, and others). Screens are yours once scaffolded, so take what you
  want from a fresh scaffold rather than expecting an upgrade to change them.

---

## Renames

Every name that changed, from the approved list in `docs/conformance-manifest.md`. Database
columns, enum values and copy slugs are above, with their SQL; this section is the code. A
renamed component keeps its props unless the next section says otherwise.

### Logistic: Screens and routes

| Old | New |
| --- | --- |
| screen `receipt`, route `/admin/logistic/receipt[/[id]]` | `inbound-receipt`, `/admin/logistic/inbound-receipt[/[id]]` |
| screen `return`, route `/admin/logistic/return[/[id]]` | `return-authorization`, `/admin/logistic/return-authorization[/[id]]` |
| screen `stock`, route `/admin/logistic/stock` | `stock-level`, `/admin/logistic/stock-level` |
| route `/warehouse/pick[/[id]]` | `/warehouse/pick-task[/[id]]` |
| route `/warehouse/receive[/[id]]` | `/warehouse/inbound-receipt[/[id]]` |
| route `/warehouse/count[/[id]]` | `/warehouse/cycle-count[/[id]]` |
| form action `addLine`, `receiveLine` (inbound receipt) | `addInboundReceiptLine`, `receiveInboundReceiptLine` |
| form field `line_id` | `inbound_receipt_line_id` |

### Logistic: Components

| Old | New |
| --- | --- |
| `ReceiptCard`, `.receipt-card` | `InboundReceiptCard`, `.inbound-receipt-card` |

### Logistic: View-model types (`views.ts`)

| Old | New |
| --- | --- |
| `StockListView` | `StockLevelListView` |
| `ReturnListView`, `ReturnDetailView` | `ReturnAuthorizationListView`, `ReturnAuthorizationDetailView` |
| `PickQueueView` | `PickTaskWarehouseQueueView` |
| `PickTaskDetailView` (warehouse) | `PickTaskWarehouseDetailView` |
| `ReceiveQueueView`, `ReceiveDetailView` | `InboundReceiptWarehouseQueueView`, `InboundReceiptWarehouseDetailView` |
| `CountQueueView`, `CountDetailView` | `CycleCountWarehouseQueueView`, `CycleCountWarehouseDetailView` |
| `LocationOption` | `StorageLocationOption` |
| `ScreenCopy`, `ScreenLocale`, `ScreenPage`, `ScreenFormResult` | declared once, not per module |
| field `LogisticMetrics.pendingReceiptCount` | `pendingInboundReceiptCount` |
| field `LogisticMetrics.openReturnCount` | `openReturnAuthorizationCount` |
| field `LogisticDashboardView.pendingReceipts`, `openReturns` | `pendingInboundReceipts`, `openReturnAuthorizations` |
| field `StockLevelListView.levels`, `history`, `historyId` | `stockLevels`, `stockAdjustments`, `historyStockLevelId` |
| field `PickQueueView.myTasks`, `openTasks` | `myPickTasks`, `openPickTasks` |
| field `ReceiveQueueView.active`, `recent` | `activeInboundReceipts`, `recentInboundReceipts` |
| field `CountQueueView.myCounts`, `openCounts` | `myCycleCounts`, `openCycleCounts` |
| field `ReceiveDetailView.receipt`, `PickTaskDetailView.task` | `inboundReceipt`, `pickTask` |

### Content: Screens and routes

| Old | New |
| --- | --- |
| screen `admin-article` | `article-admin` (qualifier after parent) |
| screen `preview`, route `/preview/[token]` | `article-preview`, `/article-preview/[token]` |
| screen `feeds` | `feed` (singular) |
| `feed-articles.ts` | `feed-article.ts` |

### Content: Components

| Old | New | Root class |
| --- | --- | --- |
| `AssignmentQueue` | `ArticleAssignmentQueue` | `.article-assignment-queue` |
| `BylineList` | `ArticleBylineList` | `.article-byline-list` |
| `MediaFigure` | `MediaAssetFigure` | `.media-asset-figure` |
| `TopicTag` | `TopicLink`. It renders an `<a>` to `/?topic=…`, and `tag` is a separate table. | `.topic-link` |
| `SectionFront` | `FrontDetail`. Its prop is `front: FrontWithSlots`. | `.front-detail` |
| `SectionLabel` | `SectionLink`. It always renders an `<a>`. | `.section-link` |
| `ArticleView` | `ArticleDetail` | `.article-detail` |
| `AuthorProfileView` | `AuthorProfileDetail` | `.author-profile-detail` |
| `LiveCoverageView` | `LiveCoverageDetail` | `.live-coverage-detail` |
| `LiveUpdateItem` (prop `update`) | `LiveUpdateCard` (prop `liveUpdate`). It renders a self-contained `<article>`. | `.live-update-card` |
| `NewsletterSignup` | `NewsletterSubscriptionForm` | `.newsletter-subscription-form` |
| `BlockEditorHost` + coreui `BlockEditor` | `ArticleBlockEditor` | `.article-block-editor`, internals `.article-block-editor__*` |
| `ArticleWorkflowPanel` tab "Team", class `__team-item` | "Assignment", `__assignment` | — |
| `ArticleWorkflowPanel` hard-coded "Status", "Checklist", "Team" | copy slugs (see below) | slug |
| local type `AssignmentWithArticle` (in `AssignmentQueue`) | `ArticleAssignmentWithArticle` | type |

### Content: Types

| Old | New |
| --- | --- |
| `ArticlePageView` | `ArticleDetailView` |
| `SectionPageView` | `SectionDetailView` |
| `PreviewPageView` | `ArticlePreviewDetailView` |
| `AdminArticleListView`, `AdminArticleDetailView` | `ArticleAdminListView`, `ArticleAdminDetailView` |
| `ChecklistEntry` | `ArticleChecklistEntry` |
| `ParagraphBlockContent`, `HeadingBlockContent`, `ImageBlockContent`, `GalleryBlockContent`, `VideoBlockContent`, `EmbedBlockContent`, `PullquoteBlockContent`, `LiveUpdateBlockContent` | `ArticleBlockParagraphContent`, … (parent `ArticleBlock` first) |
| `MediaType` / enum `media_type` | `MediaAssetType` / `media_asset_type` |
| `MediaLicense` / enum `media_license` | `MediaAssetLicense` / `media_asset_license` |

### coreui: Components and exports

| Old | New |
| --- | --- |
| `RadioItem` | `RadioGroupItem` |
| `TableHead` (`<thead>`), `TableHeader` (`<th>`) | `TableHead` kept; `TableHeader` → `TableHeaderCell` |
| `LocaleEdit`, `LocalTextEdit`, `LocalTextLinkEdit` | moved to the base template as `LocaleFieldset`, `LocalTextFieldset`, `LocalTextLinkFieldset` |
| `LocaleSwitcher` | `LocalePicker` |
| `StatusBadge` | removed |
| `BlockEditor`, type `EditorBlock` | moved to content as `ArticleBlockEditor`; type `ArticleBlockDraft` |
| `MessageAriaLive` | `MessageLiveRegion`. It is the message system's polite/assertive live region; "aria" names a technology, not the concept. |
| `SBMessage`, `SBMessageAction`, `SBMessageSeverity` | `Message`, `MessageAction`, `MessageSeverity` |
| `DEFAULT_MESSAGE_LABELS` | no longer exported |
| `interface MessageBus` | `type MessageBus` (TS convention: `type` unless merging) |
| `.table .align-right` | `.table__cell--end` (logical, BEM) |

### coreui: CSS classes

| Old | New |
| --- | --- |
| `.btn` | `.button` |
| `.progress` | `.progress-bar` |
| `.notification` | `.inline-notification` |
| `.datetime-picker` | `.date-time-picker` |
| `.aria-live` | `.message-live-region` |
| `.radio-item` | `.radio-group-item` |
| `.table-header` | `.table-header-cell` |
| `.locale-switcher` | `.locale-picker` |
| `.checkbox-wrap`, `.switch-wrap` | `.checkbox`, `.switch` become the wrapping root; the inputs become `.checkbox__control`, `.switch__control` |
| `.table-wrap` | `.table` becomes the scroll root; `<table>` becomes `.table__element` |
| `.block-editor`, `.block-*`, `.add-block-btn`, `.embed-*`, `.heading-level-select` | move with the component as `.article-block-editor__*` |
| `.locale-edit`, `.local-text-edit`, `.local-text-link-edit` | move with the components as `.locale-fieldset`, `.local-text-fieldset`, `.local-text-link-fieldset` |

### Base and SuperPrototype templates

| Old | New |
| --- | --- |
| `navigation_item.scope` | `navigation_item.menu` (already flagged in CLAUDE.md as colliding with the i18n scope) |
| `src/lib/server/scoped-copy.ts`, `hooks.server.ts` call `.from(` | not route files; excluded from the Phase 9 "no `.from(` in routes" check. (content's `feed-articles.ts` is the third non-route file in the 35, and it moves into the content seam.) |

### Screen fields, form actions and copy

| Old | New |
| --- | --- |
| view fields `receipts`, `receipt` (admin inbound receipt), `returns`, `counts`, `locations` (3 views), `task`, `active`, `recent`, `openTotal` | `inboundReceipts`, `inboundReceipt`, `returnAuthorizations`, `cycleCounts`, `storageLocations`, `pickTask`, `activeInboundReceipts`, `recentInboundReceipts`, `openPickTaskTotal` |
| warehouse copy `logistic.pick.*`, `logistic.count.*`, `logistic.receive.*`; nav `logistic.warehouse.pick` (+ `.hint`) etc. | `logistic.warehouse.pick_task.*`, `logistic.warehouse.cycle_count.*`, `logistic.warehouse.inbound_receipt.*`; `logistic.warehouse.pick_task.title` (+ `.hint`) |
| `logistic.pick.task` (dashboard label) | `logistic.pick_task.one` |
| form actions `gradeLine`, `addContact`, `deleteContact`, `addEvent` | `gradeReturnAuthorizationLine`, `addSupplierContact`, `deleteSupplierContact`, `addTrackingEvent` |
| form fields `line_id`, `task_id`, `count_id`, `contact_id`, `location_ids` | `inbound_receipt_line_id`, `return_authorization_line_id`, `pick_task_line_id`, `cycle_count_line_id`, `pick_task_id`, `cycle_count_id`, `supplier_contact_id`, `storage_location_ids` |
| English "RMA" (`logistic.return_authorization.one`) | "Return authorization" |
| `newsletter.*` and `action.submit_for_review` … `action.unpublish` in scope `content` | `content.newsletter_subscription_form.*`, `content.article_workflow.*` |
| page-local CSS `admin-article`, `admin-article-list` | `article-admin`, `article-admin-list` |

### Abbreviations spelled out

| Old | New |
| --- | --- |
| copy slugs `nav.*`, `admin.nav.*`, `logistic.admin.nav.*`, `logistic.warehouse.nav` | `navigation.*`, `admin.navigation.*`, `logistic.admin.navigation.*`, `logistic.warehouse.navigation` |
| data keys and locals `navItems`, `navItem`, `NavItem`, `navLinks`, `navId`, `navResult` | `navigationItems`, `navigationItem`, `NavigationItem`, `navigationLinks`, `navigationItemId`, `navigationItemResult` |
| CSS `__nav`, `__nav-link`, `.pagination__button--nav`, `.nav-item-edit-page`, `.warehouse-home__flow-desc` | `__navigation`, `__navigation-link`, `.pagination__button--navigation`, `.navigation-item-edit-page`, `.warehouse-home__flow-hint` |
| element ids `nav-href`, `nav-menu`, `nav-position` | `navigation-item-href`, `navigation-item-menu`, `navigation-item-position` |
| locals `msg`, `imgError`, `str`, `e` (multi-line or non-lambda), `urlEls`, field `desc` | `message`, `imageError`, `text`, `entry`/`event`, `urlElements`, `hint` |

### Screen and layout class names

| Old | New |
| --- | --- |
| screen root blocks named freely (`.receipt-list`, `.count-detail`, `.pick-task`, `.article-page`, `.preview-page`, `.stock-page`, `.dashboard`, …) | the view type with `View` → `Screen`: `.inbound-receipt-list-screen`, `.cycle-count-detail-screen`, `.pick-task-warehouse-detail-screen`, `.article-detail-screen`, `.article-preview-detail-screen`, `.stock-level-list-screen`; base screens by concept and role: `.admin-dashboard-screen`, `.locale-admin-list-screen`, `.local-text-admin-detail-screen`, `.navigation-item-admin-list-screen`, `.sign-in-screen`; `.warehouse-home-screen` (the home page has no view type of its own) |
| sub-blocks of a screen: `.cycle-count-new-form`, `.receipt-new-form`, `.return-new-form`, `.shipment-new-form`, `.sign-in-card`, `.stat` | `.<screen>__new-form`, `.sign-in-screen__card`, `.admin-dashboard-screen__stat` |
| root layout `.app`, `.full-page` | `.app-layout`, `.full-page-layout` |
| `.sr-only` (three copies) | `.visually-hidden` in `src/utilities.css`, `layer(utilities)` |
| bare elements under a block (`__pullquote p`, `__embed iframe`, `__live-update p`, `__detail dt`/`dd`, `__meta dt`/`code`, `__filing dt`/`dd`, `__meta-item dt`/`dd`, `__logo a`, `kitchen__pages a`) | `__pullquote-text`, `__embed-frame`, `__live-update-text`, `__detail-term`/`-value`, `__meta-term`/`-code`, `__filing-term`/`-value`, `__meta-term`/`-value`, `__logo-link`, `__page-link` |
| coreui table rules on `tr`, `td`, `th`, `thead` | `.table-row`, `.table-cell`, `.table-header-cell`, `.table-head` |

---

## Form-action errors

`ScreenFormResult.error` is a `ScreenFormError` (`{ slug, detail? }`) instead of a string, and its
success branch no longer has `message`. Actions return `formError(status, slug, detail?)` from
`$lib/server/form-error`; screens show `formErrorText(form.error, screenDictionary,
globalDictionary)` from `$lib/FormError/form-error`, with `form.error.detail` as the notification's
detail. Copy every new file from a fresh scaffold, and in your own actions replace each
`fail(n, { error: '…' })` with a slug you seed in every locale.

content's `validateArticleForPublish` returns `PublishValidationIssue[]` (empty when the article is
ready) instead of throwing, and `PublishValidationError` is now `PublishValidationIssue`: `message`
became `slug` (`content.publish_validation.*`) and `values`, formatted by the caller with
`dictionary.formatText(issue.slug, issue.values, 'content')`. It still throws if `imageProvenance`
is given without `locale`, which is a caller's mistake.

**Re-run the 2.0 seeds after upgrading.** The error copy is new rows; an action whose slug has no
row shows "Something went wrong" in the reader's language and logs the slug on the server.

---

## coreui `useField`

`useField()` returns `FieldControl | null` instead of `FieldContext | null`, and `FieldContext` is no
longer exported. `FieldControl` holds only what a control puts on its focusable element, under the
HTML attribute names:

| `FieldContext` (1.x) | `FieldControl` (2.0 train, coreui 1.0) |
| --- | --- |
| `id` | `id` |
| `hintId`, `errorId`, `hint`, `error` (to work out the description yourself) | `'aria-describedby'`, already worked out: the error's id, else the hint's, else nothing |
| `error` (to work out invalid) | `'aria-invalid'`: `true` or `undefined` |
| `required`, `disabled` | `required`, `disabled` |
| `labelId` | none; a native control named by `<label for>` does not need it |

A custom control that computed its own description can spread the result instead:
`<input {...useField()} />`. Only logistic's `BarcodeInput` used it outside coreui, and it has moved.

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

