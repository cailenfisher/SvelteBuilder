import type { PageLoad } from './$types';
import { posts, postCategories, postTags, comments } from '$lib/blog-fixtures.js';
import { error } from '@sveltejs/kit';

export const load: PageLoad = ({ params }) => {
  const post = posts.find(p => p.slug === params.slug);
  if (!post) throw error(404, `Post "${params.slug}" not found`);

  return {
    post,
    categories: postCategories[String(post.id)] ?? [],
    tags:       postTags[String(post.id)]       ?? [],
    comments:   comments.filter(c => c.postId === post.id && c.approved),
  };
};
