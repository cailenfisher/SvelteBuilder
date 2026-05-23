// Components — Camp 2 (entity-aware, import @sveltebuilder/hermes)
export { default as PostCard } from './components/PostCard.svelte';
export { default as PostList } from './components/PostList.svelte';
export { default as PostBody } from './components/PostBody.svelte';
export { default as PostMeta } from './components/PostMeta.svelte';
export { default as CategoryPill } from './components/CategoryPill.svelte';
export { default as TagPill } from './components/TagPill.svelte';
export { default as CommentList } from './components/CommentList.svelte';

// Components — Camp 1 (i18n-agnostic, no hermes import)
export { default as CommentForm } from './components/CommentForm.svelte';
export { default as PostStatusBadge } from './components/PostStatusBadge.svelte';
export { default as ReadingTime } from './components/ReadingTime.svelte';

// Types
export type {
  Post,
  PostCategory,
  PostTag,
  Comment,
  PostStatus,
  PostWithCopy,
  PostCategoryWithCopy,
  PostTagWithCopy,
  CommentWithAuthor,
} from './schema/index.js';
