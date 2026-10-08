<script lang="ts">
  import { Table, TableBody, TableCell, TableFoot, TableHead, TableHeader, TableRow } from '@sveltebuilder/coreui';
  import Example from '$lib/Example.svelte';

  type Line = { sku: string; quantity: number; location: string };
  const lines: Line[] = [
    { sku: 'BOLT-M8', quantity: 120, location: 'A-04-2' },
    { sku: 'NUT-M8', quantity: 240, location: 'A-04-3' },
    { sku: 'WASHER-8', quantity: 60, location: 'B-01-1' },
  ];

  let direction = $state<'asc' | 'desc'>('asc');
  const sorted = $derived(
    [...lines].sort((a, b) => (direction === 'asc' ? a.quantity - b.quantity : b.quantity - a.quantity))
  );
  const total = $derived(lines.reduce((sum, line) => sum + line.quantity, 0));
</script>

<Example title="Caption, sortable header, footer">
  <div style:inline-size="100%">
    <Table caption="Pick list 0091">
      <TableHead>
        <TableRow>
          <TableHeader>SKU</TableHeader>
          <TableHeader
            sortable
            sorted={direction}
            onSort={() => (direction = direction === 'asc' ? 'desc' : 'asc')}>Quantity</TableHeader
          >
          <TableHeader>Location</TableHeader>
        </TableRow>
      </TableHead>
      <TableBody>
        {#each sorted as line (line.sku)}
          <TableRow>
            <TableHeader scope="row">{line.sku}</TableHeader>
            <TableCell>{line.quantity}</TableCell>
            <TableCell>{line.location}</TableCell>
          </TableRow>
        {/each}
      </TableBody>
      <TableFoot>
        <TableRow>
          <TableHeader scope="row">Total</TableHeader>
          <TableCell colspan={2}>{total}</TableCell>
        </TableRow>
      </TableFoot>
    </Table>
  </div>
</Example>
