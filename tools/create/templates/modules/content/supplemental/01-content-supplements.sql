-- Content module supplements: cross-package FKs and RLS policies.
--
-- RLS predicates use public.current_user_id() (bigint) and user_account.admin.
-- Never use auth.uid(), auth.jwt(), or uuid comparisons here.
--
-- All tables with RLS already declared in the content package schema files
-- (set_updated_at trigger is also defined inline there).
-- This file adds only the cross-package FK to user_account, which is defined
-- in the scaffold schema and cannot be expressed in the module's own SQL.

-- ── Cross-package foreign keys ───────────────────────────────────────────────

alter table public.article_assignment
  add constraint fk_article_assignment_user_account
  foreign key (user_account_id) references public.user_account(id) on delete cascade;

alter table public.article_revision
  add constraint fk_article_revision_user_account
  foreign key (user_account_id) references public.user_account(id) on delete cascade;

alter table public.author_profile
  add constraint fk_author_profile_user_account
  foreign key (user_account_id) references public.user_account(id) on delete set null;

alter table public.comment
  add constraint fk_comment_user_account
  foreign key (user_account_id) references public.user_account(id) on delete set null;

alter table public.media_asset
  add constraint fk_media_asset_uploaded_by
  foreign key (uploaded_by) references public.user_account(id) on delete restrict;
