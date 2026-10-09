<script lang="ts">
  import { DateTimePicker, Label } from '@sveltebuilder/coreui';
  import Example from '$lib/Example.svelte';

  let publishAt = $state('2026-10-07T09:30:00.000Z');
  let changes = $state<string[]>([]);
</script>

<div style:display="grid" style:gap="var(--space-2)" style:max-inline-size="28rem">
  <Example title="Bound value, UTC">
    <Label for="publish-at">Publish at</Label>
    <DateTimePicker
      id="publish-at"
      bind:value={publishAt}
      timezone="UTC"
      onValueChange={(iso) => (changes = [String(iso), ...changes])}
    />
    <p role="status">Value: <code>{publishAt || '(empty)'}</code></p>
  </Example>

  <Example title="Another timezone, with bounds">
    <Label for="embargo">Embargo until (Tokyo)</Label>
    <DateTimePicker
      id="embargo"
      timezone="Asia/Tokyo"
      min="2026-10-01T00:00:00.000Z"
      max="2026-12-31T23:59:00.000Z"
    />
  </Example>

  <Example title="Required and disabled">
    <Label for="required-at" required>Ship by</Label>
    <DateTimePicker id="required-at" required />
    <Label for="disabled-at">Locked</Label>
    <DateTimePicker id="disabled-at" value="2026-10-07T12:00:00.000Z" disabled />
  </Example>
</div>
