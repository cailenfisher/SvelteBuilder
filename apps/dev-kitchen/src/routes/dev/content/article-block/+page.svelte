<script lang="ts">
  import { ArticleBlockRenderer, MediaFigure } from '@sveltebuilder/content';
  import Example from '$lib/Example.svelte';
  import { ATTRIBUTIONS, BLOCKS, MEDIA, MEDIA_ASSETS, STORAGE_BASE_URL, contentDictionary } from '$lib/fixtures/content';

  const dictionary = contentDictionary();
</script>

{#each BLOCKS as block (block.id)}
  <Example title={`Block: ${block.blockType}`}>
    <div style:inline-size="min(100%, 40rem)">
      <ArticleBlockRenderer
        {block}
        mediaAssets={MEDIA_ASSETS}
        attributions={ATTRIBUTIONS}
        storageBaseUrl={STORAGE_BASE_URL}
        locale="en"
        {dictionary}
      />
    </div>
  </Example>
{/each}

<Example title="MediaFigure with caption, credit and license">
  <div style:inline-size="min(100%, 32rem)">
    <MediaFigure
      asset={MEDIA[0]}
      attribution={ATTRIBUTIONS.get(MEDIA[0].id)}
      locale="en"
      storageBaseUrl={STORAGE_BASE_URL}
      {dictionary}
    />
  </div>
</Example>

<Example title="MediaFigure, uncaptioned and decorative">
  <div style:inline-size="min(100%, 20rem)">
    <MediaFigure asset={MEDIA[1]} captioned={false} locale="en" storageBaseUrl={STORAGE_BASE_URL} {dictionary} />
  </div>
  <div style:inline-size="min(100%, 20rem)">
    <MediaFigure asset={MEDIA[1]} decorative locale="en" storageBaseUrl={STORAGE_BASE_URL} {dictionary} />
  </div>
</Example>
