<script lang="ts">
  import './admin-dashboard-screen.css';
  import { getDictionary } from 'diglossia/svelte'
  import {
    Card,
    Badge,
    Button,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableHeaderCell,
    TableCell,
  } from '@sveltebuilder/coreui'
  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()

  const dictionary = getDictionary()

  type BadgeVariant = 'default' | 'brand' | 'success' | 'warning' | 'danger' | 'info'

  const stats = $derived([
    {
      label: dictionary.localText('admin.dashboard.stat.total_users'),
      value: data.stats.totalUsers ?? '—',
      variant: 'default' as BadgeVariant,
    },
    {
      label: dictionary.localText('admin.dashboard.stat.active_sessions'),
      value: data.stats.activeSessions ?? '—',
      variant: 'info' as BadgeVariant,
    },
    {
      label: dictionary.localText('admin.dashboard.stat.published'),
      value: data.stats.published ?? '—',
      variant: 'success' as BadgeVariant,
    },
    {
      label: dictionary.localText('admin.dashboard.stat.pending_review'),
      value: data.stats.pendingReview ?? '—',
      variant: 'warning' as BadgeVariant,
    },
  ])

  type ItemStatus = 'active' | 'pending' | 'inactive'
  const statusVariant: Record<ItemStatus, BadgeVariant> = {
    active: 'success',
    pending: 'warning',
    inactive: 'default',
  }

  // Replace with a real load function query — see +page.server.ts
  const recentItems: { id: number; name: string; status: ItemStatus; date: string }[] = []
</script>

<div class="admin-dashboard-screen">
  <header class="admin-dashboard-screen__header">
    <h1 class="admin-dashboard-screen__title">{dictionary.localText('admin.dashboard.title')}</h1>
  </header>

  <section class="admin-dashboard-screen__stats" aria-label={dictionary.localText('admin.stats.key_metrics')}>
    {#each stats as stat}
      <Card>
        <div class="admin-dashboard-screen__stat">
          <p class="admin-dashboard-screen__stat-label">{stat.label}</p>
          <p class="admin-dashboard-screen__stat-value">{stat.value}</p>
          <Badge variant={stat.variant} size="sm">{stat.variant}</Badge>
        </div>
      </Card>
    {/each}
  </section>

  <section class="admin-dashboard-screen__section">
    <div class="admin-dashboard-screen__section-header">
      <h2 class="admin-dashboard-screen__section-title">{dictionary.localText('admin.dashboard.recent.title')}</h2>
      <Button variant="secondary" size="sm">{dictionary.localText('action.view_all')}</Button>
    </div>

    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>{dictionary.localText('table.id')}</TableHeaderCell>
          <TableHeaderCell>{dictionary.localText('table.name')}</TableHeaderCell>
          <TableHeaderCell>{dictionary.localText('table.status')}</TableHeaderCell>
          <TableHeaderCell>{dictionary.localText('table.date')}</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {#each recentItems as item}
          <TableRow>
            <TableCell>{item.id}</TableCell>
            <TableCell>{item.name}</TableCell>
            <TableCell>
              <Badge variant={statusVariant[item.status]} size="sm">
                {dictionary.localText(`status.${item.status}`)}
              </Badge>
            </TableCell>
            <TableCell>{item.date}</TableCell>
          </TableRow>
        {:else}
          <TableRow>
            <TableCell colspan={4}>
              <p class="admin-dashboard-screen__empty">{dictionary.localText('feedback.empty')}</p>
            </TableCell>
          </TableRow>
        {/each}
      </TableBody>
    </Table>
  </section>
</div>
