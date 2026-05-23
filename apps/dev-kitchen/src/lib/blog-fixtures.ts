import type {
  Post,
  PostCategory,
  PostTag,
  CommentWithAuthor,
} from '@sveltebuilder/blog';
import type { DictionaryPayload } from '@sveltebuilder/hermes';

export const categories: PostCategory[] = [
  { id: 1, slug: 'technology', active: true, sortOrder: 1, createdAt: '2025-01-01T00:00:00Z' },
  { id: 2, slug: 'design', active: true, sortOrder: 2, createdAt: '2025-01-01T00:00:00Z' },
];

export const tags: PostTag[] = [
  { id: 1, slug: 'svelte', active: true, createdAt: '2025-01-01T00:00:00Z' },
  { id: 2, slug: 'web-dev', active: true, createdAt: '2025-01-01T00:00:00Z' },
  { id: 3, slug: 'ui-design', active: true, createdAt: '2025-01-01T00:00:00Z' },
];

export const posts: Post[] = [
  {
    id: 1,
    slug: 'building-with-svelte-5-runes',
    userAccountId: 'demo-user-1',
    status: 'published',
    featured: true,
    allowComment: true,
    readingTimeMinute: 8,
    publishedAt: '2025-03-15T10:00:00Z',
    createdAt: '2025-03-10T09:00:00Z',
    updatedAt: '2025-03-20T14:00:00Z',
  },
  {
    id: 2,
    slug: 'design-systems-at-scale',
    userAccountId: 'demo-user-1',
    status: 'published',
    featured: false,
    allowComment: true,
    readingTimeMinute: 12,
    publishedAt: '2025-02-20T14:30:00Z',
    createdAt: '2025-02-18T10:00:00Z',
    updatedAt: '2025-02-20T14:30:00Z',
  },
  {
    id: 3,
    slug: 'sveltekit-routing-patterns',
    userAccountId: 'demo-user-2',
    status: 'published',
    featured: false,
    allowComment: false,
    readingTimeMinute: 6,
    publishedAt: '2025-01-10T08:00:00Z',
    createdAt: '2025-01-08T15:00:00Z',
    updatedAt: '2025-01-10T08:00:00Z',
  },
  {
    id: 4,
    slug: 'accessibility-in-component-libraries',
    userAccountId: 'demo-user-1',
    status: 'review',
    featured: false,
    allowComment: false,
    readingTimeMinute: 10,
    publishedAt: null,
    createdAt: '2025-04-01T09:00:00Z',
    updatedAt: '2025-04-03T11:00:00Z',
  },
];

// Post id (as string) → categories mapping for PostList
export const postCategories: Record<string, PostCategory[]> = {
  '1': [categories[0]],
  '2': [categories[0], categories[1]],
  '3': [categories[0]],
  '4': [categories[1]],
};

// Post id (as string) → tags mapping for PostList
export const postTags: Record<string, PostTag[]> = {
  '1': [tags[0], tags[1]],
  '2': [tags[1], tags[2]],
  '3': [tags[0], tags[1]],
  '4': [tags[2]],
};

export const comments: CommentWithAuthor[] = [
  {
    id: 1,
    postId: 1,
    userAccountId: 'demo-user-2',
    parentCommentId: null,
    body: 'Really enjoyed this article! The $derived rune finally clicked for me after reading this.',
    approved: true,
    createdAt: '2025-03-16T08:30:00Z',
    updatedAt: '2025-03-16T08:30:00Z',
    authorDisplayName: 'Alex Chen',
    replies: [
      {
        id: 2,
        postId: 1,
        userAccountId: 'demo-user-1',
        parentCommentId: 1,
        body: 'Glad it helped! The key is remembering that $derived is lazy — it only recomputes when read.',
        approved: true,
        createdAt: '2025-03-16T11:00:00Z',
        updatedAt: '2025-03-16T11:00:00Z',
        authorDisplayName: 'Cailen',
        replies: [],
      },
    ],
  },
  {
    id: 3,
    postId: 1,
    userAccountId: null,
    parentCommentId: null,
    body: 'Is there a migration guide for converting Svelte 4 stores to runes?',
    approved: true,
    createdAt: '2025-03-17T16:45:00Z',
    updatedAt: '2025-03-17T16:45:00Z',
    authorDisplayName: null,
    replies: [],
  },
  {
    id: 4,
    postId: 1,
    userAccountId: 'demo-user-3',
    parentCommentId: null,
    body: 'I wrote a follow-up post comparing this to Vue 3 composition API if anyone is interested.',
    approved: false,
    createdAt: '2025-03-18T09:00:00Z',
    updatedAt: '2025-03-18T09:00:00Z',
    authorDisplayName: 'Sam Rivera',
    replies: [],
  },
];

export const blogDictionaryPayload: DictionaryPayload = [
  // Blog UI strings — scope: 'blog'
  { link: { id: 100, slug: 'blog.post.by',         scope: 'blog', entityId: null }, content: 'By {author}',           localeCode: 'en' },
  { link: { id: 101, slug: 'blog.reading_time',     scope: 'blog', entityId: null }, content: '{minutes} min read',   localeCode: 'en' },
  { link: { id: 102, slug: 'blog.status.draft',     scope: 'blog', entityId: null }, content: 'Draft',                localeCode: 'en' },
  { link: { id: 103, slug: 'blog.status.review',    scope: 'blog', entityId: null }, content: 'In Review',            localeCode: 'en' },
  { link: { id: 104, slug: 'blog.status.published', scope: 'blog', entityId: null }, content: 'Published',            localeCode: 'en' },
  { link: { id: 105, slug: 'blog.status.archived',  scope: 'blog', entityId: null }, content: 'Archived',             localeCode: 'en' },
  { link: { id: 106, slug: 'blog.comment.pending',  scope: 'blog', entityId: null }, content: 'Awaiting moderation',  localeCode: 'en' },
  { link: { id: 107, slug: 'blog.post.updated',     scope: 'blog', entityId: null }, content: 'Updated {date}',       localeCode: 'en' },
  { link: { id: 108, slug: 'blog.post.list.empty',  scope: 'blog', entityId: null }, content: 'No posts yet.',        localeCode: 'en' },

  // Category names — scope: 'post_category'
  { link: { id: 200, slug: 'name', scope: 'post_category', entityId: 1 }, content: 'Technology', localeCode: 'en' },
  { link: { id: 201, slug: 'name', scope: 'post_category', entityId: 2 }, content: 'Design',     localeCode: 'en' },

  // Tag names — scope: 'post_tag'
  { link: { id: 300, slug: 'name', scope: 'post_tag', entityId: 1 }, content: 'Svelte',   localeCode: 'en' },
  { link: { id: 301, slug: 'name', scope: 'post_tag', entityId: 2 }, content: 'Web Dev',  localeCode: 'en' },
  { link: { id: 302, slug: 'name', scope: 'post_tag', entityId: 3 }, content: 'UI Design', localeCode: 'en' },

  // Post 1 — scope: 'post', entityId: 1
  {
    link: { id: 400, slug: 'title', scope: 'post', entityId: 1 },
    content: 'Building with Svelte 5 Runes',
    localeCode: 'en',
  },
  {
    link: { id: 401, slug: 'excerpt', scope: 'post', entityId: 1 },
    content: 'An introduction to the new reactivity model in Svelte 5, covering $state, $derived, $effect, and $props — and why runes make Svelte easier to learn.',
    localeCode: 'en',
  },
  {
    link: { id: 402, slug: 'body', scope: 'post', entityId: 1 },
    content: `<h2>Introduction</h2>
<p>Svelte 5 introduces <strong>runes</strong> — a new primitive-based reactivity system that replaces the magic compiler transforms of Svelte 4. Instead of relying on <code>$:</code> labels and <code>export let</code>, you now express reactivity explicitly.</p>
<h2>The core runes</h2>
<p>There are four runes you will use daily:</p>
<ul>
  <li><code>$state</code> — reactive state declaration</li>
  <li><code>$derived</code> — computed values that update automatically</li>
  <li><code>$effect</code> — side effects (DOM mutations, subscriptions)</li>
  <li><code>$props()</code> — component prop destructuring</li>
</ul>
<h2>Why runes?</h2>
<p>The runes API is explicit, TypeScript-friendly, and works the same in both <code>.svelte</code> files and <code>.svelte.ts</code> modules. The reactivity rules are no longer tied to the compiler context — a significant win for tooling and mental models.</p>
<blockquote>
  <p>Svelte 5 runes make the reactivity contract visible. There is no more magic — just JavaScript you can read and debug.</p>
</blockquote>
<h2>Migration from Svelte 4</h2>
<p>You can adopt runes incrementally. Svelte 4 syntax continues to work in Svelte 5, so you can migrate component by component at your own pace.</p>
<pre><code>// Svelte 4
export let count = 0;
$: doubled = count * 2;

// Svelte 5
let count = $state(0);
const doubled = $derived(count * 2);</code></pre>`,
    localeCode: 'en',
  },

  // Post 2 — scope: 'post', entityId: 2
  {
    link: { id: 403, slug: 'title', scope: 'post', entityId: 2 },
    content: 'Design Systems at Scale: Lessons Learned',
    localeCode: 'en',
  },
  {
    link: { id: 404, slug: 'excerpt', scope: 'post', entityId: 2 },
    content: 'Building a design system that serves dozens of teams requires tradeoffs between flexibility and consistency. Here is what we learned the hard way.',
    localeCode: 'en',
  },
  {
    link: { id: 405, slug: 'body', scope: 'post', entityId: 2 },
    content: `<h2>Start with constraints</h2>
<p>The most important decision in a design system is not which component library to use — it is deciding what the system will <em>not</em> do. Every constraint you enforce at the system level is a decision teams do not have to make individually.</p>
<h2>Tokens first, components second</h2>
<p>Design tokens — color, spacing, typography, shadow — are the foundation. Components built on arbitrary values become unmanageable. Tokens built on a clear scale become a shared language.</p>
<pre><code>--color-surface-base
--color-surface-raised
--color-text-primary
--color-text-secondary</code></pre>
<h2>Accessibility is not a feature</h2>
<p>WCAG compliance baked into base components is dramatically cheaper than retrofitting. Every interactive component needs keyboard navigation, focus management, and appropriate ARIA roles before it ships.</p>
<p>The cost of a broken keyboard flow in a base <code>Button</code> is multiplied by every consumer. Build it right once.</p>`,
    localeCode: 'en',
  },

  // Post 3 — scope: 'post', entityId: 3
  {
    link: { id: 406, slug: 'title', scope: 'post', entityId: 3 },
    content: 'SvelteKit Routing Patterns for Multilingual Apps',
    localeCode: 'en',
  },
  {
    link: { id: 407, slug: 'excerpt', scope: 'post', entityId: 3 },
    content: 'How to structure SvelteKit routes for applications that serve content in multiple languages, without rewriting every loader.',
    localeCode: 'en',
  },
  {
    link: { id: 408, slug: 'body', scope: 'post', entityId: 3 },
    content: `<h2>The locale in the URL</h2>
<p>For public-facing multilingual sites, put the locale in the URL: <code>/en/blog</code>, <code>/fr/blog</code>. This makes pages individually cacheable and shareable, and avoids session-based locale state.</p>
<h2>Root layout load</h2>
<p>Resolve the active locale once, at the root layout. Every nested layout and page inherits it via <code>data</code>. Pass the locale to hermes at the root — not per page.</p>
<h2>The dictionary shape</h2>
<p>Fetch the full dictionary for the active locale at the root layout level. Domain modules like <code>@sveltebuilder/blog</code> contribute their copy via the same dictionary — they do not fetch independently.</p>
<h2>Handling fallback</h2>
<p>Always configure a fallback locale. If a translation is missing in the user's language, hermes falls back to the configured default and logs a warning — visible in development, silent in production.</p>`,
    localeCode: 'en',
  },

  // Post 4 — scope: 'post', entityId: 4
  {
    link: { id: 409, slug: 'title', scope: 'post', entityId: 4 },
    content: 'Accessibility in Component Libraries',
    localeCode: 'en',
  },
  {
    link: { id: 410, slug: 'excerpt', scope: 'post', entityId: 4 },
    content: 'A practical guide to building accessible components from the ground up — keyboard navigation, focus management, ARIA, and testing strategies.',
    localeCode: 'en',
  },
  {
    link: { id: 411, slug: 'body', scope: 'post', entityId: 4 },
    content: `<h2>Start with the keyboard</h2>
<p>If every interactive element in your library works perfectly with only a keyboard, you have solved 80% of accessibility. Tab, Enter, Space, Escape, and arrow keys cover the vast majority of interaction patterns.</p>`,
    localeCode: 'en',
  },
];
