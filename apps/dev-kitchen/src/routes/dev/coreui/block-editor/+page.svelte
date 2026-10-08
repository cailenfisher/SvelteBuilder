<script lang="ts">
  import { BlockEditor, type EditorBlock } from '@sveltebuilder/coreui';
  import Example from '$lib/Example.svelte';

  let blocks = $state<EditorBlock[]>([
    { id: 1, blockType: 'heading', position: 1, content: { level: 2 }, text: 'Council advances transit levy' },
    { id: 2, blockType: 'paragraph', position: 2, content: {}, text: 'The vote passed seven to two.' },
    { id: 3, blockType: 'image', position: 3, content: {}, mediaAssetId: 12 },
    { id: 4, blockType: 'pullquote', position: 4, content: {}, text: 'We have waited a decade for this.' },
    { id: 5, blockType: 'embed', position: 5, content: { provider: 'other', url: '' } },
  ]);

  let changes = $state(0);
  let lastText = $state('');
</script>

<Example title="Editable">
  <div style:inline-size="100%">
    <BlockEditor
      bind:blocks
      onBlocksChange={() => changes++}
      onBlockTextChange={(id, text) => (lastText = `${id}: ${text}`)}
    />
    <p role="status">{blocks.length} blocks, {changes} structural changes. Last edit: {lastText || '(none)'}</p>
  </div>
</Example>

<Example title="Read-only">
  <div style:inline-size="100%">
    <BlockEditor blocks={blocks.slice(0, 2)} readonly />
  </div>
</Example>
