<script lang="ts">
  import { NewsletterSignup, SubscriberList } from '@sveltebuilder/content';
  import Example from '$lib/Example.svelte';
  import { NEWSLETTER, SUBSCRIBERS, contentDictionary } from '$lib/fixtures/content';

  const dictionary = contentDictionary();
  let page = $state(1);
</script>

<div style:display="grid" style:gap="var(--space-2)" style:max-inline-size="36rem">
  <Example title="NewsletterSignup">
    <NewsletterSignup newsletter={NEWSLETTER} action="#subscribe" {dictionary} />
  </Example>

  <Example title="After a successful submit">
    <NewsletterSignup newsletter={NEWSLETTER} formResult={{ success: true }} {dictionary} />
  </Example>

  <Example title="After a failed submit">
    <NewsletterSignup
      newsletter={NEWSLETTER}
      formResult={{ success: false, error: '' }}
      {dictionary}
    />
  </Example>
</div>

<Example title="SubscriberList">
  <div style:inline-size="100%">
    <SubscriberList
      subscribers={SUBSCRIBERS}
      newsletter={NEWSLETTER}
      total={SUBSCRIBERS.length}
      {page}
      perPage={20}
      onPageChange={(next) => (page = next)}
      locale="en"
    />
  </div>
</Example>
