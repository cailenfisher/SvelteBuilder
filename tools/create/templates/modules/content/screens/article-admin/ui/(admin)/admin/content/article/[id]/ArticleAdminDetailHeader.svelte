<!-- The article's identity in the newsroom: back to the list, its headline, its workflow
     status and its URL slug. -->
<script lang="ts">
  import './article-admin-detail-header.css';
  import type { DictionaryInstance } from 'diglossia';
  import { Badge } from '@sveltebuilder/coreui';
  import type { ArticleWithBlocks } from '@sveltebuilder/content/views';

  type Props = {
    article: ArticleWithBlocks;
    /** The screen's scoped dictionary: module copy and the article's own copy. */
    dictionary: DictionaryInstance;
  };

  let { article, dictionary }: Props = $props();
</script>

<header class="article-admin-detail-header">
  <a href="/admin/content/article" class="article-admin-detail-header__back">
    ← {dictionary.localText('content.article_admin.article', 'content')}
  </a>
  <div class="article-admin-detail-header__title-row">
    <h1 class="article-admin-detail-header__title">
      {dictionary.localText('headline', 'article', article.id)}
    </h1>
    <Badge variant={article.status.slug === 'published' ? 'success' : 'default'}>
      {dictionary.localText('name', 'article_status', article.status.id)}
    </Badge>
  </div>
  <p class="article-admin-detail-header__slug"><code>{article.canonicalSlug}</code></p>
</header>
