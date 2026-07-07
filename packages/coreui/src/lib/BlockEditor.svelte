<!-- BlockEditor: Camp 1 structured-block editor.
     Operates on a blocks array (value) and emits change events.
     Does NOT resolve or store i18n copy — that is the Camp 2 BlockEditorHost's concern.
     The editor is purely a UI primitive: add, remove, reorder, and edit block config.
     Keyboard: Tab/Shift-Tab between blocks; Enter to add a paragraph after current block.
     ARIA: list role for block collection; each block labeled with type + position. -->
<script lang="ts">
  type BlockType = 'paragraph' | 'heading' | 'image' | 'gallery' | 'video' | 'embed' | 'pullquote' | 'live_update';

  export type EditorBlock = {
    id: number | string;
    blockType: BlockType;
    position: number;
    content: Record<string, unknown>;
    text?: string;
  };

  type Props = {
    blocks?: EditorBlock[];
    onBlocksChange?: (blocks: EditorBlock[]) => void;
    onBlockTextChange?: (blockId: number | string, text: string) => void;
    readonly?: boolean;
    class?: string | undefined;
  };

  let {
    blocks = $bindable([]),
    onBlocksChange,
    onBlockTextChange,
    readonly = false,
    class: extraClass,
  }: Props = $props();

  let nextTempId = $state(Date.now());

  function notify(updated: EditorBlock[]) {
    blocks = updated;
    onBlocksChange?.(updated);
  }

  function addBlock(afterPosition: number, type: BlockType = 'paragraph') {
    if (readonly) return;
    const id = `temp-${nextTempId++}`;
    const newBlocks = blocks.flatMap((b) =>
      b.position === afterPosition ? [b, { id, blockType: type, position: afterPosition + 1, content: {}, text: '' }] : [b],
    );
    // Re-number positions
    notify(newBlocks.map((b, i) => ({ ...b, position: i + 1 })));
  }

  function removeBlock(id: number | string) {
    if (readonly) return;
    const updated = blocks.filter((b) => b.id !== id).map((b, i) => ({ ...b, position: i + 1 }));
    notify(updated);
  }

  function moveBlock(id: number | string, direction: 'up' | 'down') {
    if (readonly) return;
    const idx = blocks.findIndex((b) => b.id === id);
    if (idx < 0) return;
    const target = direction === 'up' ? idx - 1 : idx + 1;
    if (target < 0 || target >= blocks.length) return;
    const updated = [...blocks];
    [updated[idx], updated[target]] = [updated[target], updated[idx]];
    notify(updated.map((b, i) => ({ ...b, position: i + 1 })));
  }

  function updateBlockContent(id: number | string, key: string, val: unknown) {
    if (readonly) return;
    notify(blocks.map((b) => b.id === id ? { ...b, content: { ...b.content, [key]: val } } : b));
  }

  const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
    paragraph: 'Paragraph',
    heading: 'Heading',
    image: 'Image',
    gallery: 'Gallery',
    video: 'Video',
    embed: 'Embed',
    pullquote: 'Pullquote',
    live_update: 'Live Update',
  };

  const PROSE_TYPES: BlockType[] = ['paragraph', 'heading', 'pullquote', 'live_update'];

  function handleKeydown(e: KeyboardEvent, block: EditorBlock) {
    if (readonly) return;
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addBlock(block.position);
    }
  }
</script>

<div
  class={['block-editor', readonly ? 'block-editor--readonly' : '', extraClass ?? ''].filter(Boolean).join(' ')}
  role="region"
  aria-label="Article block editor"
>
  <ol class="block-list" aria-label="Content blocks">
    {#each blocks as block (block.id)}
      <li
        class="block-item"
        data-block-type={block.blockType}
        aria-label={`Block ${block.position}: ${BLOCK_TYPE_LABELS[block.blockType]}`}
      >
        <div class="block-controls" aria-label="Block controls">
          <span class="block-type-label" aria-hidden="true">{BLOCK_TYPE_LABELS[block.blockType]}</span>

          {#if !readonly}
            <div class="block-actions">
              <button
                class="block-btn"
                onclick={() => moveBlock(block.id, 'up')}
                disabled={block.position === 1}
                aria-label={`Move block ${block.position} up`}
                type="button"
              >↑</button>
              <button
                class="block-btn"
                onclick={() => moveBlock(block.id, 'down')}
                disabled={block.position === blocks.length}
                aria-label={`Move block ${block.position} down`}
                type="button"
              >↓</button>
              <button
                class="block-btn block-btn--danger"
                onclick={() => removeBlock(block.id)}
                aria-label={`Remove block ${block.position}`}
                type="button"
              >✕</button>
            </div>
          {/if}
        </div>

        <div class="block-content">
          {#if PROSE_TYPES.includes(block.blockType)}
            {#if block.blockType === 'heading'}
              <div class="block-heading-row">
                <select
                  class="heading-level-select"
                  value={(block.content as { level?: number }).level ?? 2}
                  onchange={(e) => updateBlockContent(block.id, 'level', Number((e.target as HTMLSelectElement).value))}
                  disabled={readonly}
                  aria-label="Heading level"
                >
                  <option value={2}>H2</option>
                  <option value={3}>H3</option>
                  <option value={4}>H4</option>
                </select>
              </div>
            {/if}
            <textarea
              class="block-textarea"
              value={block.text ?? ''}
              placeholder={`${BLOCK_TYPE_LABELS[block.blockType]} text…`}
              disabled={readonly}
              aria-label={`${BLOCK_TYPE_LABELS[block.blockType]} text, block ${block.position}`}
              rows={block.blockType === 'paragraph' ? 4 : 2}
              oninput={(e) => {
                const val = (e.target as HTMLTextAreaElement).value;
                blocks = blocks.map((b) => b.id === block.id ? { ...b, text: val } : b);
                onBlockTextChange?.(block.id, val);
              }}
              onkeydown={(e) => handleKeydown(e, block)}
            ></textarea>
          {:else if block.blockType === 'image' || block.blockType === 'gallery'}
            <p class="block-placeholder">
              {BLOCK_TYPE_LABELS[block.blockType]} — select media asset in the media panel.
              {#if block.mediaAssetId ?? (block.content as Record<string, unknown>).mediaAssetId}
                <span class="block-asset-set">✓ Asset selected</span>
              {/if}
            </p>
          {:else if block.blockType === 'video' || block.blockType === 'embed'}
            <div class="block-embed-fields">
              <label class="embed-label">
                Provider
                <select
                  class="embed-select"
                  value={(block.content as { provider?: string }).provider ?? ''}
                  onchange={(e) => updateBlockContent(block.id, 'provider', (e.target as HTMLSelectElement).value)}
                  disabled={readonly}
                >
                  {#if block.blockType === 'video'}
                    <option value="youtube">YouTube</option>
                    <option value="vimeo">Vimeo</option>
                    <option value="self">Self-hosted</option>
                  {:else}
                    <option value="twitter">Twitter / X</option>
                    <option value="instagram">Instagram</option>
                    <option value="other">Other</option>
                  {/if}
                </select>
              </label>
              <label class="embed-label">
                URL
                <input
                  type="url"
                  class="embed-input"
                  value={(block.content as { url?: string }).url ?? ''}
                  oninput={(e) => updateBlockContent(block.id, 'url', (e.target as HTMLInputElement).value)}
                  disabled={readonly}
                  placeholder="https://…"
                  aria-label={`${BLOCK_TYPE_LABELS[block.blockType]} URL`}
                />
              </label>
            </div>
          {/if}
        </div>

        {#if !readonly}
          <button
            class="add-block-btn"
            onclick={() => addBlock(block.position)}
            aria-label={`Add block after block ${block.position}`}
            type="button"
          >+ Add block</button>
        {/if}
      </li>
    {/each}
  </ol>

  {#if !readonly && blocks.length === 0}
    <button
      class="add-block-btn add-block-btn--empty"
      onclick={() => notify([{ id: `temp-${nextTempId++}`, blockType: 'paragraph', position: 1, content: {}, text: '' }])}
      type="button"
    >+ Add first block</button>
  {/if}
</div>

<style>
  .block-editor {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .block-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .block-item {
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    padding: var(--space-3);
    background: var(--surface);
  }

  .block-controls {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-block-end: var(--space-2);
  }

  .block-type-label {
    font-size: var(--text-xs);
    font-weight: var(--weight-medium);
    color: var(--text-soft);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .block-actions {
    display: flex;
    gap: var(--space-1);
  }

  .block-btn {
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
    transition: background var(--duration) var(--ease), color var(--duration) var(--ease);
  }

  .block-btn:hover:not(:disabled) { background: var(--surface-raised); color: var(--text); }
  .block-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .block-btn--danger:hover:not(:disabled) { background: color-mix(in srgb, var(--danger), white 90%); color: var(--danger); }

  .block-textarea {
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
    box-sizing: border-box;
  }

  .block-textarea:focus {
    outline: var(--focus-ring);
    outline-offset: var(--focus-ring-offset);
  }

  .block-placeholder {
    font-size: var(--text-sm);
    color: var(--text-soft);
    margin: 0;
    padding: var(--space-3);
    background: var(--surface-raised);
    border-radius: var(--radius);
    text-align: center;
  }

  .block-asset-set {
    color: var(--success);
    font-weight: var(--weight-medium);
  }

  .block-embed-fields {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .embed-label {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--text);
  }

  .embed-select,
  .embed-input {
    border: 1px solid var(--border-color);
    border-radius: var(--radius);
    padding: var(--space-2) var(--space-3);
    font-family: var(--font);
    font-size: var(--text-sm);
    color: var(--text);
    background: var(--surface);
  }

  .embed-select:focus,
  .embed-input:focus {
    outline: var(--focus-ring);
    outline-offset: var(--focus-ring-offset);
  }

  .heading-level-select {
    border: 1px solid var(--border-color);
    border-radius: var(--radius-sm);
    padding: var(--space-1) var(--space-2);
    font-size: var(--text-xs);
    color: var(--text-soft);
    background: var(--surface-raised);
    margin-block-end: var(--space-2);
  }

  .block-heading-row {
    margin-block-end: var(--space-1);
  }

  .add-block-btn {
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
    transition: background var(--duration) var(--ease), color var(--duration) var(--ease), border-color var(--duration) var(--ease);
  }

  .add-block-btn:hover {
    background: var(--surface-raised);
    color: var(--text);
    border-color: var(--border-strong);
  }

  .add-block-btn--empty {
    padding: var(--space-6);
    border-width: 2px;
  }
</style>
