<script lang="ts">
  import {
    Card,
    Badge,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableHeader,
    TableCell,
    Button,
  } from '@sveltebuilder/coreui'

  type BadgeVariant = 'default' | 'brand' | 'success' | 'warning' | 'danger' | 'info'

  const stats: { label: string; value: string; note: string; variant: BadgeVariant }[] = [
    { label: 'Total Users', value: '—', note: 'replace with real query', variant: 'default' },
    { label: 'Active Sessions', value: '—', note: 'replace with real query', variant: 'info' },
    { label: 'Published', value: '—', note: 'replace with real query', variant: 'success' },
    { label: 'Pending Review', value: '—', note: 'replace with real query', variant: 'warning' },
  ]

  type ItemStatus = 'active' | 'pending' | 'inactive'
  const statusVariant: Record<ItemStatus, BadgeVariant> = {
    active: 'success',
    pending: 'warning',
    inactive: 'default',
  }

  // Replace with a real +page.server.ts load function querying your data.
  const recentItems: { id: number; name: string; status: ItemStatus; date: string }[] = [
    { id: 1, name: 'Example Record', status: 'active', date: '2026-05-23' },
    { id: 2, name: 'Another Record', status: 'pending', date: '2026-05-22' },
    { id: 3, name: 'Third Record', status: 'inactive', date: '2026-05-21' },
  ]
</script>

<div class="dashboard">
  <header class="dashboard__header">
    <h1 class="dashboard__title">Dashboard</h1>
  </header>

  <section class="dashboard__stats" aria-label="Key metrics">
    {#each stats as stat}
      <Card>
        <div class="stat">
          <p class="stat__label">{stat.label}</p>
          <p class="stat__value">{stat.value}</p>
          <Badge variant={stat.variant} size="sm">{stat.note}</Badge>
        </div>
      </Card>
    {/each}
  </section>

  <section class="dashboard__section">
    <div class="dashboard__section-header">
      <h2 class="dashboard__section-title">Recent Records</h2>
      <Button variant="secondary" size="sm">View all</Button>
    </div>

    <Table>
      <TableHead>
        <TableRow>
          <TableHeader>ID</TableHeader>
          <TableHeader>Name</TableHeader>
          <TableHeader>Status</TableHeader>
          <TableHeader>Date</TableHeader>
        </TableRow>
      </TableHead>
      <TableBody>
        {#each recentItems as item}
          <TableRow>
            <TableCell>{item.id}</TableCell>
            <TableCell>{item.name}</TableCell>
            <TableCell>
              <Badge variant={statusVariant[item.status]} size="sm">{item.status}</Badge>
            </TableCell>
            <TableCell>{item.date}</TableCell>
          </TableRow>
        {/each}
      </TableBody>
    </Table>
  </section>
</div>

<style>
  .dashboard {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .dashboard__header {
    display: flex;
    align-items: baseline;
  }

  .dashboard__title {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0;
    line-height: 1.25;
  }

  .dashboard__stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1rem;
  }

  .stat {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .stat__label {
    margin: 0;
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--color-text-secondary, inherit);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .stat__value {
    margin: 0;
    font-size: 2rem;
    font-weight: 700;
    line-height: 1;
    color: var(--color-text-primary, inherit);
  }

  .dashboard__section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .dashboard__section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .dashboard__section-title {
    font-size: 1.125rem;
    font-weight: 600;
    margin: 0;
  }
</style>
