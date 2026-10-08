<script lang="ts">
  import { AuthorProfileView } from '@sveltebuilder/content';
  import Example from '$lib/Example.svelte';
  import { ARTICLES_WITH_COPY, AUTHORS, MEDIA_ASSETS, STORAGE_BASE_URL, contentDictionary } from '$lib/fixtures/content';

  const dictionary = contentDictionary();
</script>

<Example title="With avatar and articles">
  <AuthorProfileView
    author={AUTHORS[0]}
    articles={ARTICLES_WITH_COPY}
    mediaAssets={MEDIA_ASSETS}
    storageBaseUrl={STORAGE_BASE_URL}
    avatarSrc={`${STORAGE_BASE_URL}/portrait.svg`}
    locale="en"
    {dictionary}
  />
</Example>

<Example title="No avatar, no articles">
  <AuthorProfileView
    author={AUTHORS[1]}
    articles={[]}
    mediaAssets={MEDIA_ASSETS}
    storageBaseUrl={STORAGE_BASE_URL}
    locale="en"
    {dictionary}
  />
</Example>
