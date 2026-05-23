<svelte:head>
  <title>Blog — Dev Kitchen</title>
</svelte:head>

<div class="dev-page">
  <h1>Blog Components</h1>

  <section class="dev-section">
    <h2>Entity Display</h2>
    <div class="grid">
      <a href="/dev/blog/post-card" class="component-card">PostCard</a>
      <a href="/dev/blog/post-list" class="component-card">PostList</a>
      <a href="/dev/blog/post-body" class="component-card">PostBody</a>
      <a href="/dev/blog/post-meta" class="component-card">PostMeta</a>
    </div>
  </section>

  <section class="dev-section">
    <h2>Taxonomy</h2>
    <div class="grid">
      <a href="/dev/blog/category-pill" class="component-card">CategoryPill</a>
      <a href="/dev/blog/tag-pill" class="component-card">TagPill</a>
    </div>
  </section>

  <section class="dev-section">
    <h2>Comments</h2>
    <div class="grid">
      <a href="/dev/blog/comment-form" class="component-card">CommentForm</a>
      <a href="/dev/blog/comment-list" class="component-card">CommentList</a>
    </div>
  </section>

  <section class="dev-section">
    <h2>Indicators</h2>
    <div class="grid">
      <a href="/dev/blog/post-status-badge" class="component-card">PostStatusBadge</a>
      <a href="/dev/blog/reading-time" class="component-card">ReadingTime</a>
    </div>
  </section>
</div>

<style>
  .dev-page {
    max-width: 56rem;
  }

  h1 {
    margin-block-end: 2rem;
  }

  .dev-section {
    margin-block-end: 2rem;
  }

  h2 {
    margin-block-end: 0.75rem;
    font-size: 1rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    opacity: 0.6;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(9rem, 1fr));
    gap: 0.75rem;
  }

  .component-card {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    border: 1px solid currentColor;
    border-radius: 0.375rem;
    text-decoration: none;
    font-weight: 500;
    transition: background-color 0.1s;
  }

  .component-card:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }
</style>
