<script lang="ts">
  import { localText } from '@sveltebuilder/hermes';
  import {
    Button, Tabs, TabsList, TabsTrigger, TabsContent,
    Table, TableHead, TableBody, TableRow, TableHeader, TableCell,
    Dialog, Pagination,
  } from '@sveltebuilder/coreui';
  import { PostStatusBadge } from '@sveltebuilder/blog';
  import type { PageData } from './$types';
  import type { Post, PostStatus } from '@sveltebuilder/blog';

  let { data }: { data: PageData } = $props();

  const title       = $derived(localText('blog.admin.post.list.title', 'blog'));
  const newLabel    = $derived(localText('blog.admin.post.new', 'blog'));
  const editLabel   = $derived(localText('blog.admin.post.edit', 'blog'));
  const deleteLabel = $derived(localText('blog.admin.post.delete', 'blog'));
  const publishLabel   = $derived(localText('blog.admin.post.publish', 'blog'));
  const unpublishLabel = $derived(localText('blog.admin.post.unpublish', 'blog'));

  const statusTabs: Array<{ value: PostStatus | ''; label: string }> = [
    { value: '', label: 'All' },
    { value: 'draft',     label: localText('blog.status.draft', 'blog') },
    { value: 'review',    label: localText('blog.status.review', 'blog') },
    { value: 'published', label: localText('blog.status.published', 'blog') },
    { value: 'archived',  label: localText('blog.status.archived', 'blog') },
  ];

  let deleteTarget = $state<Post | null>(null);
  let deleteOpen   = $state(false);
  // svelte-ignore state_referenced_locally
  let page         = $state(data.page);

  function formatDate(iso: string): string {
    return new Intl.DateTimeFormat(data.locale.code, { dateStyle: 'medium' }).format(new Date(iso));
  }

  function statusLabel(status: PostStatus): string {
    return localText(`blog.status.${status}`, 'blog');
  }

  async function handlePublish(post: Post) {
    await fetch(`/api/blog/post/${post.id}/publish`, { method: 'POST' });
    location.reload();
  }

  async function handleUnpublish(post: Post) {
    await fetch(`/api/blog/post/${post.id}/unpublish`, { method: 'POST' });
    location.reload();
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    await fetch(`/api/blog/post/${deleteTarget.id}`, { method: 'DELETE' });
    deleteOpen = false;
    deleteTarget = null;
    location.reload();
  }
</script>

<div class="admin-post-list">
  <header class="admin-post-list__header">
    <h1 class="admin-post-list__title">{title}</h1>
    <Button href="/admin/blog/new" variant="primary">{newLabel}</Button>
  </header>

  <!-- Status filter tabs -->
  <Tabs value={data.status ?? ''}>
    <TabsList aria-label="Filter posts by status">
      {#each statusTabs as tab}
        <TabsTrigger
          value={tab.value}
          href={`/admin/blog${tab.value ? `?status=${tab.value}` : ''}`}
        >
          {tab.label}
        </TabsTrigger>
      {/each}
    </TabsList>

    <TabsContent value={data.status ?? ''}>
      <Table>
        <TableHead>
          <TableRow>
            <TableHeader>Title</TableHeader>
            <TableHeader>Status</TableHeader>
            <TableHeader>Published</TableHeader>
            <TableHeader>
              <span class="sr-only">Actions</span>
            </TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {#each data.posts as post (post.id)}
            <TableRow>
              <TableCell>
                <a
                  href="/admin/blog/{post.id}"
                  class="admin-post-list__post-link"
                >
                  {localText(`title.${post.id}`, 'post')}
                </a>
              </TableCell>
              <TableCell>
                <PostStatusBadge
                  status={post.status}
                  label={statusLabel(post.status)}
                />
              </TableCell>
              <TableCell>
                {post.publishedAt ? formatDate(post.publishedAt) : '—'}
              </TableCell>
              <TableCell>
                <div class="admin-post-list__actions">
                  <Button href="/admin/blog/{post.id}" variant="ghost" size="sm">
                    {editLabel}
                  </Button>

                  {#if post.status !== 'published'}
                    <Button
                      variant="ghost"
                      size="sm"
                      onclick={() => handlePublish(post)}
                    >{publishLabel}</Button>
                  {:else}
                    <Button
                      variant="ghost"
                      size="sm"
                      onclick={() => handleUnpublish(post)}
                    >{unpublishLabel}</Button>
                  {/if}

                  <Button
                    variant="danger"
                    size="sm"
                    onclick={() => { deleteTarget = post; deleteOpen = true; }}
                  >{deleteLabel}</Button>
                </div>
              </TableCell>
            </TableRow>
          {/each}
        </TableBody>
      </Table>

      {#if data.total > data.perPage}
        <nav class="admin-post-list__pagination" aria-label="Pagination">
          <Pagination
            count={data.total}
            perPage={data.perPage}
            bind:page
          />
        </nav>
      {/if}
    </TabsContent>
  </Tabs>
</div>

<!-- Delete confirmation dialog -->
<Dialog
  bind:open={deleteOpen}
  title={deleteLabel}
  description="This action cannot be undone."
>
  {#snippet children()}
    <p>{localText('feedback.confirm_delete')}</p>
  {/snippet}

  {#snippet footer()}
    <Button variant="ghost" onclick={() => { deleteOpen = false; deleteTarget = null; }}>
      {localText('action.cancel')}
    </Button>
    <Button variant="danger" onclick={confirmDelete}>
      {deleteLabel}
    </Button>
  {/snippet}
</Dialog>

<style>
  .admin-post-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
    padding: var(--space-6);
    max-width: 72rem;
    margin-inline: auto;
  }

  .admin-post-list__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
  }

  .admin-post-list__title {
    font-size: var(--text-2xl);
    font-weight: var(--weight-bold);
    color: var(--text);
    margin: 0;
  }

  .admin-post-list__post-link {
    color: var(--link-text);
    text-decoration: none;
    font-weight: var(--weight-medium);
  }

  .admin-post-list__post-link:hover {
    text-decoration: underline;
  }

  .admin-post-list__actions {
    display: flex;
    gap: var(--space-2);
    align-items: center;
  }

  .admin-post-list__pagination {
    display: flex;
    justify-content: center;
    padding-block-start: var(--space-4);
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
</style>
