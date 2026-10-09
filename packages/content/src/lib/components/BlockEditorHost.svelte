<!-- Camp 2: wraps coreui BlockEditor and wires each block's text to its LocalTextLink.
     Emits onBlocksChange with the full updated block list for the parent form action to persist.
     This component is editor-only (never rendered in a published article view). -->
<script lang="ts">
  import { untrack } from 'svelte';
  import { getDictionary } from 'diglossia/svelte';
  import type { DictionaryInstance } from 'diglossia';
  import { BlockEditor } from '@sveltebuilder/coreui';
  import type { EditorBlock } from '@sveltebuilder/coreui';
  import type { ArticleBlock } from '../schema/index.js';

  type Props = {
    blocks: ArticleBlock[];
    articleId: number;
    /** Called when blocks change — parent should debounce-persist via form action. */
    onBlocksChange?: (blocks: EditorBlock[]) => void;
    locale: string;
    dictionary?: DictionaryInstance;
  };

  let {
    blocks,
    articleId: _articleId,
    onBlocksChange,
    locale: _locale,
    dictionary: dictionaryProp,
  }: Props = $props();

  // svelte-ignore state_referenced_locally
  const dictionary = dictionaryProp ?? getDictionary();

  // Only these carry their own text; asking the dictionary for an image's or an embed's
  // text logged a missing key for every media block in the article.
  const TEXT_BLOCK_TYPES = new Set<ArticleBlock['blockType']>([
    'paragraph',
    'heading',
    'pullquote',
    'gallery',
    'live_update',
  ]);

  /** Map ArticleBlock (server) → EditorBlock (coreui). */
  function toEditorBlocks(serverBlocks: ArticleBlock[]): EditorBlock[] {
    return serverBlocks
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((b) => ({
        id: String(b.id),
        blockType: b.blockType,
        position: b.position,
        text: TEXT_BLOCK_TYPES.has(b.blockType) ? dictionary.localText('text', 'article_block', b.id) : '',
        content: b.content as EditorBlock['content'],
        mediaAssetId: b.mediaAssetId,
      }));
  }

  let editorBlocks: EditorBlock[] = $state(untrack(() => toEditorBlocks(blocks)));

  $effect(() => {
    editorBlocks = toEditorBlocks(blocks);
  });

  function handleChange(updated: EditorBlock[]) {
    editorBlocks = updated;
    onBlocksChange?.(updated);
  }
</script>

<div class="block-editor-host">
  <BlockEditor blocks={editorBlocks} onBlocksChange={handleChange} />
</div>

<style>
  .block-editor-host {
    width: 100%;
    min-height: 12rem;
  }
</style>
