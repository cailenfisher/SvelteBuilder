<!-- Camp 2: edits an article's blocks. Resolves each text block's copy (scope `article_block`) and
     its own UI copy (scope `content`) from the dictionary, and reports changes as drafts for the
     parent form action to persist. Editor-only: never rendered in a published article.
     Keyboard: Tab/Shift-Tab between controls; Enter in a text block adds a paragraph after it. -->
<script module lang="ts">
  import type { ArticleBlockType } from '../schema/index.js';

  /**
   * One block as the editor holds it: a saved block (numeric `id`) or one added in this session
   * (`temp-…` id), with its text resolved for the dictionary's locale.
   */
  export type ArticleBlockDraft = {
    id: number | string;
    blockType: ArticleBlockType;
    position: number;
    content: Record<string, unknown>;
    text?: string;
    mediaAssetId?: number | null;
  };
</script>

<script lang="ts">
  import { untrack } from 'svelte';
  import { getDictionary } from 'diglossia/svelte';
  import type { DictionaryInstance } from 'diglossia';
  import type { ArticleBlock } from '../schema/index.js';

  type Props = {
    blocks: ArticleBlock[];
    /** Called with the full block list after any structural or content change. */
    onBlocksChange?: (blocks: ArticleBlockDraft[]) => void;
    /** Called as a block's text is typed, for callers persisting text separately. */
    onBlockTextChange?: (blockId: number | string, text: string) => void;
    readonly?: boolean;
    dictionary?: DictionaryInstance;
    class?: string | undefined;
  };

  let {
    blocks,
    onBlocksChange,
    onBlockTextChange,
    readonly = false,
    dictionary: dictionaryProp,
    class: extraClass,
  }: Props = $props();

  // svelte-ignore state_referenced_locally
  const dictionary = dictionaryProp ?? getDictionary();

  // Only these carry their own text; asking the dictionary for an image's or an embed's
  // text logged a missing key for every media block in the article.
  const TEXT_BLOCK_TYPES = new Set<ArticleBlockType>([
    'paragraph',
    'heading',
    'pullquote',
    'gallery',
    'live_update',
  ]);

  const PROSE_TYPES = new Set<ArticleBlockType>(['paragraph', 'heading', 'pullquote', 'live_update']);

  function toDrafts(saved: ArticleBlock[]): ArticleBlockDraft[] {
    return saved
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((block) => ({
        id: String(block.id),
        blockType: block.blockType,
        position: block.position,
        text: TEXT_BLOCK_TYPES.has(block.blockType)
          ? dictionary.localText('text', 'article_block', block.id)
          : '',
        content: block.content as ArticleBlockDraft['content'],
        mediaAssetId: block.mediaAssetId,
      }));
  }

  let drafts: ArticleBlockDraft[] = $state(untrack(() => toDrafts(blocks)));

  $effect(() => {
    drafts = toDrafts(blocks);
  });

  let nextTempId = $state(Date.now());

  function notify(updated: ArticleBlockDraft[]) {
    drafts = updated;
    onBlocksChange?.(updated);
  }

  function addBlock(afterPosition: number, blockType: ArticleBlockType = 'paragraph') {
    if (readonly) return;
    const id = `temp-${nextTempId++}`;
    const added = drafts.flatMap((draft) =>
      draft.position === afterPosition
        ? [draft, { id, blockType, position: afterPosition + 1, content: {}, text: '' }]
        : [draft],
    );
    notify(added.map((draft, index) => ({ ...draft, position: index + 1 })));
  }

  function removeBlock(id: number | string) {
    if (readonly) return;
    notify(
      drafts
        .filter((draft) => draft.id !== id)
        .map((draft, index) => ({ ...draft, position: index + 1 })),
    );
  }

  function moveBlock(id: number | string, direction: 'up' | 'down') {
    if (readonly) return;
    const index = drafts.findIndex((draft) => draft.id === id);
    if (index < 0) return;
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= drafts.length) return;
    const reordered = [...drafts];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    notify(reordered.map((draft, position) => ({ ...draft, position: position + 1 })));
  }

  function updateBlockContent(id: number | string, key: string, value: unknown) {
    if (readonly) return;
    notify(
      drafts.map((draft) =>
        draft.id === id ? { ...draft, content: { ...draft.content, [key]: value } } : draft,
      ),
    );
  }

  function handleKeydown(event: KeyboardEvent, draft: ArticleBlockDraft) {
    if (readonly) return;
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      addBlock(draft.position);
    }
  }

  const blockTypeName = (blockType: ArticleBlockType) =>
    dictionary.localText(`content.article_block_type.${blockType}`, 'content');
</script>

<div
  class={['article-block-editor', readonly ? 'article-block-editor--readonly' : '', extraClass ?? '']
    .filter(Boolean)
    .join(' ')}
  role="region"
  aria-label={dictionary.localText('content.article_block_editor.region', 'content')}
>
  <ol
    class="article-block-editor__list"
    aria-label={dictionary.localText('content.article_block_editor.block_list', 'content')}
  >
    {#each drafts as draft (draft.id)}
      {@const typeName = blockTypeName(draft.blockType)}
      <!-- A list item cannot take an accessible name; its visible type label names it, and
           the list itself conveys position ("item 3 of 5"). -->
      <li class="article-block-editor__block" data-block-type={draft.blockType}>
        <div
          class="article-block-editor__controls"
          role="group"
          aria-label={dictionary.localText('content.article_block_editor.block_controls', 'content')}
        >
          <span class="article-block-editor__type">{typeName}</span>

          {#if !readonly}
            <div class="article-block-editor__actions">
              <button
                class="article-block-editor__action"
                onclick={() => moveBlock(draft.id, 'up')}
                disabled={draft.position === 1}
                aria-label={dictionary.formatText('content.article_block_editor.move_up', { position: draft.position }, 'content')}
                type="button">↑</button
              >
              <button
                class="article-block-editor__action"
                onclick={() => moveBlock(draft.id, 'down')}
                disabled={draft.position === drafts.length}
                aria-label={dictionary.formatText('content.article_block_editor.move_down', { position: draft.position }, 'content')}
                type="button">↓</button
              >
              <button
                class="article-block-editor__action article-block-editor__action--danger"
                onclick={() => removeBlock(draft.id)}
                aria-label={dictionary.formatText('content.article_block_editor.remove', { position: draft.position }, 'content')}
                type="button">✕</button
              >
            </div>
          {/if}
        </div>

        <div class="article-block-editor__content">
          {#if PROSE_TYPES.has(draft.blockType)}
            {#if draft.blockType === 'heading'}
              <select
                class="article-block-editor__heading-level"
                value={(draft.content as { level?: number }).level ?? 2}
                onchange={(event) =>
                  updateBlockContent(draft.id, 'level', Number(event.currentTarget.value))}
                disabled={readonly}
                aria-label={dictionary.localText('content.article_block_editor.heading_level', 'content')}
              >
                <option value={2}>H2</option>
                <option value={3}>H3</option>
                <option value={4}>H4</option>
              </select>
            {/if}
            <textarea
              class="article-block-editor__text"
              value={draft.text ?? ''}
              disabled={readonly}
              aria-label={dictionary.formatText('content.article_block_editor.text', { blockType: typeName, position: draft.position }, 'content')}
              rows={draft.blockType === 'paragraph' ? 4 : 2}
              oninput={(event) => {
                const text = event.currentTarget.value;
                drafts = drafts.map((other) => (other.id === draft.id ? { ...other, text } : other));
                onBlockTextChange?.(draft.id, text);
              }}
              onkeydown={(event) => handleKeydown(event, draft)}
            ></textarea>
          {:else if draft.blockType === 'image' || draft.blockType === 'gallery'}
            <p class="article-block-editor__media">
              {dictionary.formatText('content.article_block_editor.media', { blockType: typeName }, 'content')}
              {#if draft.mediaAssetId ?? (draft.content as Record<string, unknown>).mediaAssetId}
                <span class="article-block-editor__media-selected">
                  {dictionary.localText('content.article_block_editor.media_selected', 'content')}
                </span>
              {/if}
            </p>
          {:else if draft.blockType === 'video' || draft.blockType === 'embed'}
            <div class="article-block-editor__embed">
              <label class="article-block-editor__embed-label">
                {dictionary.localText('content.article_block_editor.provider', 'content')}
                <select
                  class="article-block-editor__embed-control"
                  value={(draft.content as { provider?: string }).provider ?? ''}
                  onchange={(event) =>
                    updateBlockContent(draft.id, 'provider', event.currentTarget.value)}
                  disabled={readonly}
                >
                  {#if draft.blockType === 'video'}
                    <option value="youtube">{dictionary.localText('content.article_block_editor.provider_youtube', 'content')}</option>
                    <option value="vimeo">{dictionary.localText('content.article_block_editor.provider_vimeo', 'content')}</option>
                    <option value="self">{dictionary.localText('content.article_block_editor.provider_self', 'content')}</option>
                  {:else}
                    <option value="twitter">{dictionary.localText('content.article_block_editor.provider_twitter', 'content')}</option>
                    <option value="instagram">{dictionary.localText('content.article_block_editor.provider_instagram', 'content')}</option>
                    <option value="other">{dictionary.localText('content.article_block_editor.provider_other', 'content')}</option>
                  {/if}
                </select>
              </label>
              <label class="article-block-editor__embed-label">
                {dictionary.localText('content.article_block_editor.url', 'content')}
                <input
                  type="url"
                  class="article-block-editor__embed-control"
                  value={(draft.content as { url?: string }).url ?? ''}
                  oninput={(event) => updateBlockContent(draft.id, 'url', event.currentTarget.value)}
                  disabled={readonly}
                />
              </label>
            </div>
          {/if}
        </div>

        {#if !readonly}
          <button
            class="article-block-editor__add"
            onclick={() => addBlock(draft.position)}
            aria-label={dictionary.formatText('content.article_block_editor.add_after', { position: draft.position }, 'content')}
            type="button"
          >
            {dictionary.localText('content.article_block_editor.add', 'content')}
          </button>
        {/if}
      </li>
    {/each}
  </ol>

  {#if !readonly && drafts.length === 0}
    <button
      class="article-block-editor__add article-block-editor__add--empty"
      onclick={() =>
        notify([{ id: `temp-${nextTempId++}`, blockType: 'paragraph', position: 1, content: {}, text: '' }])}
      type="button"
    >
      {dictionary.localText('content.article_block_editor.add_first', 'content')}
    </button>
  {/if}
</div>

<style>
  .article-block-editor {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    width: 100%;
    min-height: 12rem;
  }

  .article-block-editor__list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .article-block-editor__block {
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    padding: var(--space-3);
    background: var(--surface);
  }

  .article-block-editor__controls {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-block-end: var(--space-2);
  }

  .article-block-editor__type {
    font-size: var(--text-xs);
    font-weight: var(--weight-medium);
    color: var(--text-soft);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .article-block-editor__actions {
    display: flex;
    gap: var(--space-1);
  }

  .article-block-editor__action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.75rem;
    height: 1.75rem;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text-soft);
    cursor: pointer;
    font-size: var(--text-xs);
    transition:
      background var(--duration) var(--ease),
      color var(--duration) var(--ease);
  }

  .article-block-editor__action:hover:not(:disabled) {
    background: var(--surface-raised);
    color: var(--text);
  }

  .article-block-editor__action:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .article-block-editor__action--danger:hover:not(:disabled) {
    background: color-mix(in srgb, var(--danger), white 90%);
    color: var(--danger-text);
  }

  .article-block-editor__content {
    display: flex;
    flex-direction: column;
  }

  .article-block-editor__text {
    width: 100%;
    resize: vertical;
    min-height: 5rem;
    border: 1px solid var(--border-color);
    border-radius: var(--radius);
    padding: var(--space-2) var(--space-3);
    font-family: var(--font);
    font-size: var(--text-sm);
    color: var(--text);
    background: var(--surface);
    line-height: var(--leading-relaxed);
  }

  .article-block-editor__text:focus,
  .article-block-editor__embed-control:focus {
    outline: none;
    border-color: var(--brand);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--brand) 20%, transparent);
  }

  .article-block-editor__media {
    font-size: var(--text-sm);
    color: var(--text-soft);
    margin: 0;
    padding: var(--space-3);
    background: var(--surface-raised);
    border-radius: var(--radius);
    text-align: center;
  }

  .article-block-editor__media-selected {
    color: var(--success-text);
    font-weight: var(--weight-medium);
  }

  .article-block-editor__embed {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .article-block-editor__embed-label {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--text);
  }

  .article-block-editor__embed-control {
    border: 1px solid var(--border-color);
    border-radius: var(--radius);
    padding: var(--space-2) var(--space-3);
    font-family: var(--font);
    font-size: var(--text-sm);
    color: var(--text);
    background: var(--surface);
  }

  .article-block-editor__heading-level {
    align-self: flex-start;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-sm);
    padding: var(--space-1) var(--space-2);
    font-size: var(--text-xs);
    color: var(--text-soft);
    background: var(--surface-raised);
    margin-block-end: var(--space-2);
  }

  .article-block-editor__add {
    width: 100%;
    padding: var(--space-2);
    border: 1px dashed var(--border-color);
    border-radius: var(--radius);
    background: transparent;
    color: var(--text-soft);
    font-size: var(--text-sm);
    cursor: pointer;
    text-align: center;
    margin-block-start: var(--space-2);
    transition:
      background var(--duration) var(--ease),
      color var(--duration) var(--ease),
      border-color var(--duration) var(--ease);
  }

  .article-block-editor__add:hover {
    background: var(--surface-raised);
    color: var(--text);
    border-color: var(--border-strong);
  }

  .article-block-editor__add--empty {
    padding: var(--space-6);
    border-width: 2px;
  }
</style>
