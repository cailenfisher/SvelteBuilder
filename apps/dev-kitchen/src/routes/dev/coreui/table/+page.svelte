<script lang="ts">
  import {
    Table,
    TableHead,
    TableBody,
    TableFoot,
    TableRow,
    TableHeader,
    TableCell,
  } from '@sveltebuilder/coreui';

  const users = [
    { id: 1, name: 'Jane Smith', role: 'Engineer', status: 'Active', joined: '2022-03-15' },
    { id: 2, name: 'Bob Jones', role: 'Designer', status: 'Active', joined: '2021-11-02' },
    { id: 3, name: 'Alice Lee', role: 'Manager', status: 'Inactive', joined: '2020-06-20' },
  ];
</script>

<svelte:head>
  <title>Table — CoreUI Dev Kitchen</title>
</svelte:head>

<div class="dev-page">
  <h1>Table</h1>

  <section class="dev-section">
    <h2>Basic table with caption</h2>
    <div class="dev-stage">
      <Table caption="Team members">
        <TableHead>
          <TableRow>
            <TableHeader scope="col">Name</TableHeader>
            <TableHeader scope="col">Role</TableHeader>
            <TableHeader scope="col">Status</TableHeader>
            <TableHeader scope="col">Joined</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {#each users as user}
            <TableRow>
              <!-- Row header: scope="row" identifies this as the header for this row -->
              <TableHeader scope="row">{user.name}</TableHeader>
              <TableCell>{user.role}</TableCell>
              <TableCell>{user.status}</TableCell>
              <TableCell>{user.joined}</TableCell>
            </TableRow>
          {/each}
        </TableBody>
      </Table>
    </div>
  </section>

  <section class="dev-section">
    <h2>Sortable column headers</h2>
    <div class="dev-stage">
      <Table>
        <TableHead>
          <TableRow>
            <TableHeader scope="col" sortable sorted="asc">Name ↑</TableHeader>
            <TableHeader scope="col" sortable sorted={false}>Role</TableHeader>
            <TableHeader scope="col" sortable sorted="desc">Joined ↓</TableHeader>
            <TableHeader scope="col">Status</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {#each users as user}
            <TableRow>
              <TableHeader scope="row">{user.name}</TableHeader>
              <TableCell>{user.role}</TableCell>
              <TableCell>{user.joined}</TableCell>
              <TableCell>{user.status}</TableCell>
            </TableRow>
          {/each}
        </TableBody>
      </Table>
    </div>
  </section>

  <section class="dev-section">
    <h2>Sticky header (scroll to see effect)</h2>
    <div class="dev-stage" style="max-height: 10rem; overflow: hidden;">
      <div style="max-height: 10rem; overflow-y: auto;">
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableHeader scope="col">Name</TableHeader>
              <TableHeader scope="col">Role</TableHeader>
              <TableHeader scope="col">Status</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {#each Array(12) as _, i}
              <TableRow>
                <TableHeader scope="row">User {i + 1}</TableHeader>
                <TableCell>{i % 2 === 0 ? 'Engineer' : 'Designer'}</TableCell>
                <TableCell>Active</TableCell>
              </TableRow>
            {/each}
          </TableBody>
        </Table>
      </div>
    </div>
  </section>

  <section class="dev-section">
    <h2>Empty state row</h2>
    <div class="dev-stage">
      <Table>
        <TableHead>
          <TableRow>
            <TableHeader scope="col">Name</TableHeader>
            <TableHeader scope="col">Role</TableHeader>
            <TableHeader scope="col">Status</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <td colspan={3} style="text-align: center; opacity: 0.6; padding: 2rem; font-size: 0.875rem;">
              No results found
            </td>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  </section>
</div>

<style>
  .dev-page { max-width: 56rem; }
  h1 { margin-block-end: 2rem; }
  .dev-section { margin-block-end: 2.5rem; }
  h2 { margin-block-end: 0.75rem; font-size: 0.875rem; font-weight: 600; }
  .dev-stage { padding: 1.5rem; border: 1px solid #ccc; border-radius: 0.375rem; }
</style>
