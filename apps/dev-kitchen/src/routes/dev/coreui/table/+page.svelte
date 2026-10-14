<script lang="ts">
  import {
    Table,
    TableBody,
    TableCell,
    TableFoot,
    TableHead,
    TableHeaderCell,
    TableRow,
  } from '@sveltebuilder/coreui';
  import Example from '$lib/Example/Example.svelte';

  type Line = { sku: string; quantity: number; location: string };
  const lines: Line[] = [
    { sku: 'BOLT-M8', quantity: 120, location: 'A-04-2' },
    { sku: 'NUT-M8', quantity: 240, location: 'A-04-3' },
    { sku: 'WASHER-8', quantity: 60, location: 'B-01-1' },
  ];

  let direction = $state<'asc' | 'desc'>('asc');
  const sorted = $derived(
    [...lines].sort((a, b) =>
      direction === 'asc' ? a.quantity - b.quantity : b.quantity - a.quantity
    )
  );
  const total = $derived(lines.reduce((sum, line) => sum + line.quantity, 0));
</script>

<Example title="Caption, sortable header, footer">
  <div style:inline-size="100%">
    <Table caption="Pick list 0091">
      <TableHead>
        <TableRow>
          <TableHeaderCell>SKU</TableHeaderCell>
          <TableHeaderCell
            sortable
            sorted={direction}
            onSort={() => (direction = direction === 'asc' ? 'desc' : 'asc')}>Quantity</TableHeaderCell
          >
          <TableHeaderCell>Location</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {#each sorted as line (line.sku)}
          <TableRow>
            <TableHeaderCell scope="row">{line.sku}</TableHeaderCell>
            <TableCell>{line.quantity}</TableCell>
            <TableCell>{line.location}</TableCell>
          </TableRow>
        {/each}
      </TableBody>
      <TableFoot>
        <TableRow>
          <TableHeaderCell scope="row">Total</TableHeaderCell>
          <TableCell colspan={2}>{total}</TableCell>
        </TableRow>
      </TableFoot>
    </Table>
  </div>
</Example>
