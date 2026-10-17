<!-- How many times a callback ran, and with what last. Harness-only: the behaviour specs read it
     to prove a callback fires exactly once per change. -->
<script lang="ts">
  let { name, calls }: { name: string; calls: unknown[] } = $props();

  const format = (value: unknown) =>
    value === undefined ? 'nothing' : typeof value === 'string' ? value : JSON.stringify(value);

  const summary = $derived(
    `${name}: ${calls.length} ${calls.length === 1 ? 'call' : 'calls'}` +
      (calls.length > 0 ? `, last ${format(calls.at(-1))}` : '')
  );
</script>

<p role="status">{summary}</p>
