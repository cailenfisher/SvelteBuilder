<script lang="ts">
  import { FrontDetail } from '@sveltebuilder/content';
  import { FRONT, MEDIA_ASSETS, STORAGE_BASE_URL, contentDictionary } from '$lib/fixtures/content';

  const dictionary = contentDictionary();
</script>

<FrontDetail
  front={FRONT}
  mediaAssets={MEDIA_ASSETS}
  storageBaseUrl={STORAGE_BASE_URL}
  locale="en"
  {dictionary}
/>
