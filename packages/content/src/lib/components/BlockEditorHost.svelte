<!-- Camp 2: wraps coreui BlockEditor and wires each block's text to its LocalTextLink.
     Emits onBlocksChange with the full updated block list for the parent form action to persist.
     This component is editor-only (never rendered in a published article view). -->
<script lang="ts">
  import { untrack } from 'svelte';
  import { localText } from '@sveltebuilder/hermes';
  import { BlockEditor } from '@sveltebuilder/coreui';
  import type { EditorBlock } from '@sveltebuilder/coreui';
  import type { ArticleBlock, ArticleBlockType } from '../schema/index.js';

  type Props = {
    blocks: ArticleBlock[];
    articleId: number;
    /** Called when blocks change — parent should debounce-persist via form action. */
    onBlocksChange?: (blocks: EditorBlock[]) => void;
    locale: string;
  };

  let { blocks, articleId: _articleId, onBlocksChange, locale: _locale }: Props = $props();

  /** Map ArticleBlock (server) → EditorBlock (coreui). */
  function toEditorBlocks(serverBlocks: ArticleBlock[]): EditorBlock[] {
    return serverBlocks
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((b) => ({
        id: String(b.id),
        type: b.blockType as EditorBlock['type'],
        text: localText('text', 'article_block', b.id),
        content: b.content as EditorBlock['content'],
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
  <BlockEditor
    blocks={editorBlocks}
    onChange={handleChange}
  />
</div>

<style>
  .block-editor-host {
    width: 100%;
    min-height: 12rem;
  }
</style>
