---
'@sveltebuilder/content': major
'create-sveltebuilder': minor
'@sveltebuilder/access': minor
'@sveltebuilder/cli': minor
---

Content adopts roles and permissions (docs/ACCESS-CONTROL.md §7).

**Breaking (content):** `article_assignment.role` is now `article_assignment_role`, and the exported `ArticleAssignment` type's `role` field is `articleAssignmentRole`. Run the rename in `docs/MIGRATION-ACCESS-CONTROL.md` before syncing. `CommentList` takes `CommentRow` (a comment without its author's email address); a `Comment` still satisfies it.

Content's manifest declares its permission catalog and per-article access; its seed adds the Editor, Writer and Contributor roles. Its policies now grant by permission, by role on a single article, and by being assigned to an article, which lets you read and edit it and its body. Creating an article goes through `content_create_article`, which also writes its headline and makes the creator its author. Only `content_transition_article_status` changes an article's status, and moving to or from published takes `article.publish`. Assigning someone to an article takes `article.share`. A commenter's email address is selectable by nobody through the API. The article views gain optional `actions`; `@sveltebuilder/access/views` gains `RoleAssignmentPanelView`.

Scaffolds admit staff to `/admin`: anyone holding a role sees the admin area and the menu entries for scopes they hold (`navigation_item.permission_scope`), while administrator screens refuse them in their loaders. The article screens show only the controls the reader may use, and the access panel to anyone who may share the article. `current_user_scopes()` and `list_scope_role()` join the core access SQL, and `sync:supabase` generates an entity-aware `current_user_scopes()`.
