<script lang="ts">
  import { ArticleBlockEditor } from '@sveltebuilder/content';
  import Example from '$lib/Example/Example.svelte';
  import { BLOCKS, contentDictionary } from '$lib/fixtures/content';

  const dictionary = contentDictionary();

  // The fixture article has no video or embed; one is added so the provider fields render.
  const blocks = [
    ...BLOCKS,
    { ...BLOCKS[0], id: 107, blockType: 'embed' as const, position: BLOCKS.length + 1, content: { provider: 'other', url: '' } },
  ];

  let changes = $state(0);
  let lastText = $state('');
</script>

<Example title="Editable">
  <div style:inline-size="100%">
    <ArticleBlockEditor
      {blocks}
      onBlocksChange={() => changes++}
      onBlockTextChange={(id, text) => (lastText = `${id}: ${text}`)}
      {dictionary}
    />
    <p role="status">
      {changes} structural changes. Last edit: {lastText || '(none)'}
    </p>
  </div>
</Example>

<Example title="Read-only">
  <div style:inline-size="100%">
    <ArticleBlockEditor {blocks} readonly {dictionary} />
  </div>
</Example>

<Example title="Read-only, empty">
  <div style:inline-size="100%">
    <ArticleBlockEditor blocks={[]} readonly {dictionary} />
  </div>
</Example>

<Example title="Empty">
  <div style:inline-size="100%">
    <ArticleBlockEditor blocks={[]} {dictionary} />
  </div>
</Example>
