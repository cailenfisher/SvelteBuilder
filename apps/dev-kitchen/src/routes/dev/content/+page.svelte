<svelte:head>
  <title>Content — Dev Kitchen</title>
</svelte:head>

<div class="dev-page">
  <h1>Content Components</h1>

  <section class="dev-section">
    <h2>Camp 2 — Entity Display</h2>
    <div class="grid">
      <a href="/dev/content/article-card" class="component-card">ArticleCard</a>
      <a href="/dev/content/article-view" class="component-card">ArticleView</a>
      <a href="/dev/content/byline-list" class="component-card">BylineList</a>
      <a href="/dev/content/section-label" class="component-card">SectionLabel</a>
      <a href="/dev/content/topic-tag" class="component-card">TopicTag</a>
      <a href="/dev/content/live-update-item" class="component-card">LiveUpdateItem</a>
    </div>
  </section>

  <section class="dev-section">
    <h2>Camp 1 — Forms / Signup</h2>
    <div class="grid">
      <a href="/dev/content/newsletter-signup" class="component-card">NewsletterSignup</a>
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
