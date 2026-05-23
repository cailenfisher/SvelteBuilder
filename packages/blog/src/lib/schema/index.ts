export type PostStatus = 'draft' | 'review' | 'published' | 'archived';

export type Post = {
  id: number;
  slug: string;
  userAccountId: string;
  status: PostStatus;
  featured: boolean;
  allowComment: boolean;
  readingTimeMinute: number | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PostCategory = {
  id: number;
  slug: string;
  active: boolean;
  sortOrder: number;
  createdAt: string;
};

export type PostTag = {
  id: number;
  slug: string;
  active: boolean;
  createdAt: string;
};

// SCOPE DEVIATION: comment.body is user-generated content, not editorial copy.
// Stored directly as plain text, not as a LocalText link. Not translated.
export type Comment = {
  id: number;
  postId: number;
  userAccountId: string | null;
  parentCommentId: number | null;
  body: string;
  approved: boolean;
  createdAt: string;
  updatedAt: string;
};

// Enriched types — carry resolved copy alongside the base entity.
// Entity text uses the standard hermes pattern: slug = field name, entity_id = entity PK.
// e.g. localText('title', 'post', post.id) / localText('name', 'post_category', category.id)
export type PostWithCopy = Post & {
  title: string;
  excerpt: string;
  body: string;
  categories: PostCategoryWithCopy[];
  tags: PostTagWithCopy[];
};

export type PostCategoryWithCopy = PostCategory & {
  name: string;
};

export type PostTagWithCopy = PostTag & {
  name: string;
};

export type CommentWithAuthor = Comment & {
  authorDisplayName: string | null;
  replies: CommentWithAuthor[];
};
