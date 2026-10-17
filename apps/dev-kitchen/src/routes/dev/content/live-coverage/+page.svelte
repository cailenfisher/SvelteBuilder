<script lang="ts">
  import { LiveCoverageDetail, LiveUpdateCard } from '@sveltebuilder/content';
  import Example from '$lib/Example/Example.svelte';
  import { LIVE_COVERAGE, LIVE_UPDATES, contentDictionary } from '$lib/fixtures/content';

  const dictionary = contentDictionary();
</script>

<Example title="LiveCoverageDetail, in progress">
  <div style:inline-size="min(100%, 40rem)">
    <LiveCoverageDetail coverage={LIVE_COVERAGE} locale="en" {dictionary} />
  </div>
</Example>

<Example title="LiveCoverageDetail, ended">
  <div style:inline-size="min(100%, 40rem)">
    <LiveCoverageDetail
      coverage={{ ...LIVE_COVERAGE, active: false, endedAt: '2026-09-30T20:30:00.000Z' }}
      locale="en"
      {dictionary}
    />
  </div>
</Example>

<Example title="LiveUpdateCard, pinned and not">
  <div style:inline-size="min(100%, 40rem)">
    {#each LIVE_UPDATES.slice(0, 2) as update (update.id)}
      <LiveUpdateCard liveUpdate={update} locale="en" {dictionary} />
    {/each}
  </div>
</Example>
