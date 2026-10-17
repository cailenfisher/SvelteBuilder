<!-- Edits an article's blocks. Resolves each text block's copy (scope `article_block`) and
     its own UI copy (scope `content`) from the dictionary, and reports changes as drafts for the
     parent form action to persist. Editor-only: never rendered in a published article.
     Keyboard: Tab/Shift-Tab between controls; Enter in a text block adds a paragraph after it. -->
<script module lang="ts">
  import type { ArticleBlockType } from '../../schema/index.js';

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
  import type { ArticleBlock } from '../../schema/index.js';

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
          {#if readonly && PROSE_TYPES.has(draft.blockType)}
            <!-- Read-only shows the text as text: a disabled control is skipped by the Tab key and
                 announced as unavailable, which misreports a body that is simply not editable here. -->
            <p class="article-block-editor__prose">{draft.text}</p>
          {:else if PROSE_TYPES.has(draft.blockType)}
            {#if draft.blockType === 'heading'}
              <select
                class="article-block-editor__heading-level"
                value={(draft.content as { level?: number }).level ?? 2}
                onchange={(event) =>
                  updateBlockContent(draft.id, 'level', Number(event.currentTarget.value))}
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
          {:else if readonly && (draft.blockType === 'video' || draft.blockType === 'embed')}
            <dl class="article-block-editor__embed">
              <div>
                <dt class="article-block-editor__embed-term">{dictionary.localText('content.article_block_editor.provider', 'content')}</dt>
                <dd class="article-block-editor__embed-value">
                  {(draft.content as { provider?: string }).provider ?? ''}
                </dd>
              </div>
              <div>
                <dt class="article-block-editor__embed-term">{dictionary.localText('content.article_block_editor.url', 'content')}</dt>
                <dd class="article-block-editor__embed-value">
                  {(draft.content as { url?: string }).url ?? ''}
                </dd>
              </div>
            </dl>
          {:else if draft.blockType === 'video' || draft.blockType === 'embed'}
            <div class="article-block-editor__embed">
              <label class="article-block-editor__embed-label">
                {dictionary.localText('content.article_block_editor.provider', 'content')}
                <select
                  class="article-block-editor__embed-control"
                  value={(draft.content as { provider?: string }).provider ?? ''}
                  onchange={(event) =>
                    updateBlockContent(draft.id, 'provider', event.currentTarget.value)}
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

  {#if readonly && drafts.length === 0}
    <p class="article-block-editor__empty">
      {dictionary.localText('content.article_block_editor.empty', 'content')}
    </p>
  {:else if drafts.length === 0}
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
