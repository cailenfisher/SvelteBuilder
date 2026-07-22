# CONTENT_AUDIT.md — @sveltebuilder/content

Working reference for the content module build. Produced during Phase 0 before any code was written.

---

## 1. Blog module inventory

### Schema (packages/blog/src/lib/templates/schema/blog.sql)
- `post_status` enum: draft | review | published | archived
- `post` (id bigint, slug, user_account_id uuid, status, featured, allow_comment, reading_time_minute, published_at, created_at, updated_at)
- `post_category` (id bigint, slug, active, sort_order)
- `post_tag` (id bigint, slug, active)
- `post_category_post` junction
- `post_post_tag` junction
- `comment` (id bigint, post_id, user_account_id uuid, parent_comment_id, body, approved, created_at, updated_at)
- Updated-at trigger function `set_updated_at()`

**Issues in blog SQL:**
- `user_account_id` is UUID — must be bigint in content module (auth architecture change)
- RLS policies use `auth.uid()` / `auth.jwt() ->> 'role'` — supplemental file overrides to `current_user_id()` / `user_account.admin`
- RSS uses `encodeURIComponent(post.title)` instead of `post.slug` for URLs (bug)
- Sitemap same URL bug

### TypeScript types
- `Post`, `PostCategory`, `PostTag`, `PostStatus`, `Comment`
- Enriched: `PostWithCopy`, `PostCategoryWithCopy`, `PostTagWithCopy`, `CommentWithAuthor`
- `comment.body` documented deviation: user-generated content, not editorial copy

### Components (Camp 2)
- `PostCard.svelte` — imports hermes, resolves title/excerpt via localText
- `PostBody.svelte` — renders HTML body as {@html}, imports hermes
- `PostMeta.svelte` — byline/date display
- `PostStatusBadge.svelte` — wraps Badge with status variant
- `PostList.svelte` — list wrapper
- `CategoryPill.svelte` — link pill for category
- `TagPill.svelte` — link pill for tag
- `CommentForm.svelte` — form action for comment creation
- `CommentList.svelte` — threaded comment display
- `ReadingTime.svelte` — reading time display

### Server queries
Pattern: Supabase client, manual snake_case → camelCase mappers, `resolveEntityText` helper
Functions: `getPublishedPosts`, `getPublishedPostBySlug`, `getAdminPosts`, `getAdminPost`, `createPost`, `updatePost`, `publishPost`, `unpublishPost`, `deletePost`, `getCategories`, `getTags`, `getComments`, `createComment`, `setCommentApproval`
Also: `buildDictionaryPayload`, `buildPostDictionaryPayload`

### Server RSS/sitemap
- `generateRssFeed` — valid RSS 2.0 with XML escaping
- `getBlogSitemapEntries` — returns entries for sitemap generation

### Blog body approach
Single `body` LocalText blob per post. Content module replaces this with `article_block` table, typed blocks with `position` ordering.

### Documented deviation
`comment.body` — user-generated content, stored as plain text column, never translated. Same deviation carried into content module as `comment.body` + `comment.author_name` + `comment.author_email`.

---

## 2. CoreUI component inventory (complete as of audit)

Already in coreui — do NOT rebuild:
- Layout: `Card`, `Divider`
- Typography: `Badge`, `Tag`, `Avatar`
- Feedback: `Alert`, `ProgressBar`, `Skeleton`, `Spinner`
- Messaging: `messageBus`, `Toast`, `ToastRegion`, `InlineNotification`, `Banner`, `ConfirmDialog`, `MessageAriaLive`
- Form: `Field`, `Label`, `Input`, `Textarea`, `Checkbox`, `RadioGroup`, `RadioItem`, `Switch`, `Select`, `SelectItem`
- Action: `Button`
- Accordion: `Accordion`, `AccordionItem`
- Tabs: `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`
- Overlays: `Dialog`, `Popover`, `Tooltip`
- Menu: `Menu`, `MenuItem`, `MenuSeparator`, `MenuLabel`, `MenuGroup`, `MenuCheckboxItem`, `MenuRadioGroup`, `MenuRadioItem`, `MenuSub`
- Navigation: `LocaleSwitcher`, `Pagination`
- Data display: `MetricCard`, `Timeline`, `TimelineItem`, **`StatusBadge`**, `Table`, `TableHead`, `TableBody`, `TableFoot`, `TableRow`, `TableHeader`, `TableCell`
- LocalText admin: `LocaleEdit`, `LocalTextLinkEdit`, `LocalTextEdit`
- Scan: `BarcodeInput`

NOT yet in coreui — evaluate for addition:
- `DataTable` — paginated/filterable wrapper around Table primitives → **BUILD IN COREUI** (logistic ArticleList + future commerce order list)
- `BlockEditor` — Camp 1 rich text block editor → **BUILD IN COREUI** (content + future commerce product descriptions)
- `Drawer` — slide-out panel → **BUILD IN COREUI** (content workflow panel + logistic detail drawer)
- `DateTimePicker` — timezone-aware date+time input → **BUILD IN COREUI** (content embargo/scheduling + logistic expected_at)

---

## 3. Logistic component inventory

Logistic-specific Camp 2 wrappers (stay in logistic, NOT elevated — they wrap coreui StatusBadge with domain-specific label resolution):
- `PickTaskCard` — domain card
- `PickTaskStatusBadge` — thin StatusBadge wrapper (already uses coreui StatusBadge)
- `ReceiptCard` — domain card
- `ReturnConditionBadge` — thin StatusBadge wrapper
- `ShipmentStatusBadge` — thin StatusBadge wrapper
- `StockLevelBar` — ProgressBar wrapper with stock semantics
- `StorageLocationPath` — breadcrumb for location hierarchy
- `SupplierCard` — domain card
- `TrackingEventList` — Timeline wrapper

No logistic components need elevation. coreui already has all the primitives they compose.

---

## 4. Component precedence decisions

| Primitive needed | Decision | Reason |
|---|---|---|
| StatusBadge | REUSE from coreui | Already exists |
| MetricCard | REUSE from coreui | Already exists |
| Timeline/TimelineItem | REUSE from coreui | Already exists |
| Table family (11 components) | REUSE from coreui | Already exists |
| Pagination | REUSE from coreui | Already exists |
| Badge, Tag | REUSE from coreui | Already exists |
| Card | REUSE from coreui | Already exists |
| Dialog, Popover, Tooltip | REUSE from coreui | Already exists |
| Tabs | REUSE from coreui | Already exists |
| DataTable | NEW in coreui | Cross-domain: content ArticleList + logistic route tables |
| BlockEditor | NEW in coreui (Camp 1) | Cross-domain: content body + future commerce descriptions |
| Drawer | NEW in coreui | Cross-domain: content workflow panel + logistic detail views |
| DateTimePicker | NEW in coreui | Cross-domain: content embargo + logistic receipt expected_at |
| ArticleCard | NEW in content | Domain-specific Camp 2 |
| BylineList | NEW in content | Domain-specific Camp 2 |
| SectionLabel | NEW in content | Domain-specific Camp 2 |
| TopicTag | NEW in content | Domain-specific Camp 2 |
| LiveUpdateItem | NEW in content | Domain-specific Camp 2 |
| MediaFigure | NEW in content | Domain-specific Camp 2 |
| ArticleView | NEW in content | Domain-specific Camp 2 |
| ArticleBlockRenderer | NEW in content | Domain-specific Camp 2 |
| LiveCoverageView | NEW in content | Domain-specific Camp 2 |
| SectionFront | NEW in content | Domain-specific Camp 2 |
| AuthorProfileView | NEW in content | Domain-specific Camp 2 |
| ArticleList | NEW in content | Camp 2, uses coreui DataTable |
| SubscriberList | NEW in content | Camp 2, uses coreui DataTable |
| AssignmentQueue | NEW in content | Camp 2, uses coreui DataTable |
| ArticleWorkflowPanel | NEW in content | Camp 2, uses coreui Drawer + Tabs |
| BlockEditorHost | NEW in content | Camp 2, wraps coreui BlockEditor |
| NewsletterSignup | NEW in content | Camp 2, uses coreui form primitives |
| FrontCurationBoard | NEW in content | Camp 2, drag-order front slots |

---

## 5. Scope list

All LocalTextLink scopes introduced by content module:

| Scope | Entity | Fields linked |
|---|---|---|
| `content` | none (entity_id=null) | UI application-level copy |
| `article` | article | headline, dek |
| `article_block` | article_block | text (paragraphs, headings, pullquotes, live updates) |
| `article_status` | article_status | label |
| `publish_checklist_item` | publish_checklist_item | label |
| `section` | section | name, description |
| `topic` | topic | name |
| `tag` | tag | name |
| `author_profile` | author_profile | name, bio |
| `media_asset` | media_asset | alt_text, caption, credit |
| `front` | front | name |
| `front_slot` | front_slot | override_headline (optional) |
| `live_update` | live_update | text |
| `newsletter` | newsletter | name, description |
| `publisher_profile` | publisher_profile | name |

**Scope deviations (documented):**
- `comment.body`, `comment.author_name`, `comment.author_email` — user-generated runtime data, not editorial copy, same justified deviation as blog
- `subscriber.email_address`, `subscriber.confirmed_at` — subscriber data, never translated
- `article_assignment.role` — enum value, system data
- `article_revision` — append-only audit log, no copy fields (by design)

---

## 6. Blog retirement checklist

- Remove `packages/blog/`
- Remove `@sveltebuilder/blog` from pnpm workspace (auto via package deletion)
- Update `tools/create/src/index.ts` MODULE_DEPS + module selection
- Create `tools/create/templates/modules/content/` 
- Delete `tools/create/templates/modules/blog/`
- Update `apps/dev-kitchen` blog routes → content routes
- Update any import from `@sveltebuilder/blog` in dev-kitchen
