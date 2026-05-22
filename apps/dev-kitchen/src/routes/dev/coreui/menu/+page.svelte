<script lang="ts">
  import {
    Menu,
    MenuItem,
    MenuSeparator,
    MenuLabel,
    MenuCheckboxItem,
    MenuRadioGroup,
    MenuRadioItem,
    MenuSub,
    Button,
  } from '@sveltebuilder/coreui';

  let notifications = $state(true);
  let sounds = $state(false);
  let theme = $state('light');
</script>

<svelte:head>
  <title>Menu — CoreUI Dev Kitchen</title>
</svelte:head>

<div class="dev-page">
  <h1>Menu</h1>

  <!-- verify: aria-haspopup="menu" on trigger, role="menu" on content, aria-disabled on disabled items -->

  <section class="dev-section">
    <h2>Standard items</h2>
    <div class="dev-stage">
      <Menu>
        {#snippet trigger()}
          <Button variant="secondary">Open menu</Button>
        {/snippet}
        <MenuItem>Profile</MenuItem>
        <MenuItem>Settings</MenuItem>
        <MenuItem>Help</MenuItem>
      </Menu>
    </div>
  </section>

  <section class="dev-section">
    <h2>With separator and disabled item</h2>
    <div class="dev-stage">
      <Menu>
        {#snippet trigger()}
          <Button variant="secondary">Account menu</Button>
        {/snippet}
        <MenuLabel>My Account</MenuLabel>
        <MenuItem>Profile</MenuItem>
        <MenuItem>Settings</MenuItem>
        <MenuSeparator />
        <MenuItem disabled>Billing (unavailable)</MenuItem>
        <MenuSeparator />
        <MenuItem>Sign out</MenuItem>
      </Menu>
    </div>
  </section>

  <section class="dev-section">
    <h2>Checkbox items</h2>
    <div class="dev-stage">
      <Menu>
        {#snippet trigger()}
          <Button variant="secondary">Preferences</Button>
        {/snippet}
        <MenuLabel>Notifications</MenuLabel>
        <MenuCheckboxItem bind:checked={notifications}>
          Email notifications
        </MenuCheckboxItem>
        <MenuCheckboxItem bind:checked={sounds}>
          Sound effects
        </MenuCheckboxItem>
      </Menu>
      <p style="margin-top: 0.5rem; font-size: 0.875rem;">
        notifications: <strong>{notifications}</strong> |
        sounds: <strong>{sounds}</strong>
      </p>
    </div>
  </section>

  <section class="dev-section">
    <h2>Radio group items</h2>
    <div class="dev-stage">
      <Menu>
        {#snippet trigger()}
          <Button variant="secondary">Theme</Button>
        {/snippet}
        <MenuLabel>Theme</MenuLabel>
        <MenuRadioGroup bind:value={theme}>
          <MenuRadioItem value="light">Light</MenuRadioItem>
          <MenuRadioItem value="dark">Dark</MenuRadioItem>
          <MenuRadioItem value="system">System</MenuRadioItem>
        </MenuRadioGroup>
      </Menu>
      <p style="margin-top: 0.5rem; font-size: 0.875rem;">Theme: <strong>{theme}</strong></p>
    </div>
  </section>

  <section class="dev-section">
    <h2>With submenu</h2>
    <div class="dev-stage">
      <Menu>
        {#snippet trigger()}
          <Button variant="secondary">More options</Button>
        {/snippet}
        <MenuItem>New file</MenuItem>
        <MenuItem>Open file</MenuItem>
        <MenuSeparator />
        <MenuSub triggerLabel="Export as">
          <MenuItem>PDF</MenuItem>
          <MenuItem>CSV</MenuItem>
          <MenuItem>JSON</MenuItem>
        </MenuSub>
        <MenuSeparator />
        <MenuItem>Close</MenuItem>
      </Menu>
    </div>
  </section>
</div>

<style>
  .dev-page { max-width: 40rem; }
  h1 { margin-block-end: 2rem; }
  .dev-section { margin-block-end: 2.5rem; }
  h2 { margin-block-end: 0.75rem; font-size: 0.875rem; font-weight: 600; }
  .dev-stage { padding: 1.5rem; border: 1px solid #ccc; border-radius: 0.375rem; }
</style>
