<script lang="ts">
  import { LiveCoverageView, LiveUpdateItem } from '@sveltebuilder/content';
  import Example from '$lib/Example.svelte';
  import { LIVE_COVERAGE, LIVE_UPDATES, contentDictionary } from '$lib/fixtures/content';

  const dictionary = contentDictionary();
</script>

<Example title="LiveCoverageView, in progress">
  <div style:inline-size="min(100%, 40rem)">
    <LiveCoverageView coverage={LIVE_COVERAGE} locale="en" {dictionary} />
  </div>
</Example>

<Example title="LiveCoverageView, ended">
  <div style:inline-size="min(100%, 40rem)">
    <LiveCoverageView
      coverage={{ ...LIVE_COVERAGE, active: false, endedAt: '2026-09-30T20:30:00.000Z' }}
      locale="en"
      {dictionary}
    />
  </div>
</Example>

<Example title="LiveUpdateItem, pinned and not">
  <div style:inline-size="min(100%, 40rem)">
    {#each LIVE_UPDATES.slice(0, 2) as update (update.id)}
      <LiveUpdateItem {update} locale="en" {dictionary} />
    {/each}
  </div>
</Example>
