<script lang="ts">
  import { SectionFront } from '@sveltebuilder/content';
  import { FRONT, MEDIA_ASSETS, STORAGE_BASE_URL, contentDictionary } from '$lib/fixtures/content';

  const dictionary = contentDictionary();
</script>

<SectionFront front={FRONT} mediaAssets={MEDIA_ASSETS} storageBaseUrl={STORAGE_BASE_URL} locale="en" {dictionary} />
