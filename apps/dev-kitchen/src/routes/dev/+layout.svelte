<script lang="ts">
  let { children }: { children: any } = $props()
</script>

<div class="dev-layout">
  <nav class="dev-layout__nav">
    <strong>Kitchen</strong>
    <a href="/dev">Overview</a>
    <a href="/dev/hermes">Hermes</a>

    <strong>CoreUI</strong>
    <a href="/dev/coreui">All components</a>
    <a href="/dev/coreui/accordion">Accordion</a>
    <a href="/dev/coreui/alert">Alert</a>
    <a href="/dev/coreui/avatar">Avatar</a>
    <a href="/dev/coreui/badge">Badge</a>
    <a href="/dev/coreui/button">Button</a>
    <a href="/dev/coreui/card">Card</a>
    <a href="/dev/coreui/checkbox">Checkbox</a>
    <a href="/dev/coreui/dialog">Dialog</a>
    <a href="/dev/coreui/divider">Divider</a>
    <a href="/dev/coreui/field">Field</a>
    <a href="/dev/coreui/input">Input</a>
    <a href="/dev/coreui/label">Label</a>
    <a href="/dev/coreui/locale-edit">LocaleEdit</a>
    <a href="/dev/coreui/local-text-edit">LocalTextEdit</a>
    <a href="/dev/coreui/local-text-link-edit">LocalTextLinkEdit</a>
    <a href="/dev/coreui/menu">Menu</a>
    <a href="/dev/coreui/pagination">Pagination</a>
    <a href="/dev/coreui/popover">Popover</a>
    <a href="/dev/coreui/progress-bar">ProgressBar</a>
    <a href="/dev/coreui/radio-group">RadioGroup</a>
    <a href="/dev/coreui/select">Select</a>
    <a href="/dev/coreui/skeleton">Skeleton</a>
    <a href="/dev/coreui/spinner">Spinner</a>
    <a href="/dev/coreui/switch">Switch</a>
    <a href="/dev/coreui/table">Table</a>
    <a href="/dev/coreui/tabs">Tabs</a>
    <a href="/dev/coreui/tag">Tag</a>
    <a href="/dev/coreui/textarea">Textarea</a>
    <a href="/dev/coreui/tooltip">Tooltip</a>

    <strong>Blog</strong>
    <a href="/dev/blog">All components</a>
    <a href="/dev/blog/post-card">PostCard</a>
    <a href="/dev/blog/post-list">PostList</a>
    <a href="/dev/blog/post-body">PostBody</a>
    <a href="/dev/blog/post-meta">PostMeta</a>
    <a href="/dev/blog/category-pill">CategoryPill</a>
    <a href="/dev/blog/tag-pill">TagPill</a>
    <a href="/dev/blog/comment-form">CommentForm</a>
    <a href="/dev/blog/comment-list">CommentList</a>
    <a href="/dev/blog/post-status-badge">PostStatusBadge</a>
    <a href="/dev/blog/reading-time">ReadingTime</a>
  </nav>
  <div class="dev-layout__content">
    {@render children()}
  </div>
</div>

<style>
  .dev-layout {
    display: grid;
    grid-template-columns: 14rem 1fr;
    min-height: 100dvh;
  }

  .dev-layout__nav {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 1rem;
    border-right: 1px solid currentColor;
    overflow-y: auto;
  }

  .dev-layout__content {
    padding: 1.5rem;
  }
</style>
