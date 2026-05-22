<script lang="ts">
  import { Tabs, TabsList, TabsTrigger, TabsContent } from '@sveltebuilder/coreui';

  let activeTab = $state('account');
</script>

<svelte:head>
  <title>Tabs — CoreUI Dev Kitchen</title>
</svelte:head>

<div class="dev-page">
  <h1>Tabs</h1>

  <!-- verify: role="tablist" on list, role="tab" on triggers, role="tabpanel" on content, aria-selected on active tab -->

  <section class="dev-section">
    <h2>Horizontal (default)</h2>
    <div class="dev-stage">
      <Tabs value="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <div class="tab-body">Profile tab content</div>
        </TabsContent>
        <TabsContent value="settings">
          <div class="tab-body">Settings tab content</div>
        </TabsContent>
        <TabsContent value="billing">
          <div class="tab-body">Billing tab content</div>
        </TabsContent>
      </Tabs>
    </div>
  </section>

  <section class="dev-section">
    <h2>Vertical</h2>
    <div class="dev-stage">
      <Tabs value="general" orientation="vertical">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>
        <TabsContent value="general">
          <div class="tab-body">General settings content</div>
        </TabsContent>
        <TabsContent value="security">
          <div class="tab-body">Security settings content</div>
        </TabsContent>
        <TabsContent value="notifications">
          <div class="tab-body">Notification settings content</div>
        </TabsContent>
      </Tabs>
    </div>
  </section>

  <section class="dev-section">
    <h2>Pre-selected tab</h2>
    <div class="dev-stage">
      <Tabs value="billing">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="billing">Billing (pre-selected)</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <div class="tab-body">Profile content</div>
        </TabsContent>
        <TabsContent value="settings">
          <div class="tab-body">Settings content</div>
        </TabsContent>
        <TabsContent value="billing">
          <div class="tab-body">Billing content — this tab starts active</div>
        </TabsContent>
      </Tabs>
    </div>
  </section>

  <section class="dev-section">
    <h2>Bound value (live)</h2>
    <div class="dev-stage">
      <Tabs bind:value={activeTab}>
        <TabsList>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>
        <TabsContent value="account">
          <div class="tab-body">Account content</div>
        </TabsContent>
        <TabsContent value="privacy">
          <div class="tab-body">Privacy content</div>
        </TabsContent>
        <TabsContent value="team">
          <div class="tab-body">Team content</div>
        </TabsContent>
      </Tabs>
      <p style="margin-top: 0.75rem; font-size: 0.875rem;">Active tab: <strong>{activeTab}</strong></p>
    </div>
  </section>
</div>

<style>
  .dev-page { max-width: 40rem; }
  h1 { margin-block-end: 2rem; }
  .dev-section { margin-block-end: 2.5rem; }
  h2 { margin-block-end: 0.75rem; font-size: 0.875rem; font-weight: 600; }
  .dev-stage { padding: 1.5rem; border: 1px solid #ccc; border-radius: 0.375rem; }
  .tab-body { padding: 1rem 0; font-size: 0.875rem; color: #666; }
</style>
