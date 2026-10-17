<script lang="ts">
  import { FilterLinkList } from '@sveltebuilder/coreui';
  import Example from '$lib/Example/Example.svelte';

  const statuses = ['pending', 'partial', 'completed', 'cancelled'];
</script>

<Example title="A status filter, one option current">
  <FilterLinkList
    label="Filter by status"
    links={[
      { href: '?', label: 'All', current: false },
      ...statuses.map((status) => ({
        href: `?status=${status}`,
        label: status,
        current: status === 'partial',
      })),
    ]}
  />
</Example>
