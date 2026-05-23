<script lang="ts">
  import { Avatar } from '@sveltebuilder/coreui';
</script>

<svelte:head>
  <title>Avatar — CoreUI Dev Kitchen</title>
</svelte:head>

<div class="dev-page">
  <h1>Avatar</h1>

  <section class="dev-section">
    <h2>All sizes — with image src</h2>
    <div class="dev-stage dev-stage--row">
      <Avatar src="https://i.pravatar.cc/150?img=1" alt="Jane Smith" size="xs" />
      <Avatar src="https://i.pravatar.cc/150?img=1" alt="Jane Smith" size="sm" />
      <Avatar src="https://i.pravatar.cc/150?img=1" alt="Jane Smith" size="md" />
      <Avatar src="https://i.pravatar.cc/150?img=1" alt="Jane Smith" size="lg" />
      <Avatar src="https://i.pravatar.cc/150?img=1" alt="Jane Smith" size="xl" />
    </div>
  </section>

  <section class="dev-section">
    <h2>All sizes — fallback initials (no src)</h2>
    <div class="dev-stage dev-stage--row">
      <Avatar alt="Jane Smith" size="xs" />
      <Avatar alt="Jane Smith" size="sm" />
      <Avatar alt="Jane Smith" size="md" />
      <Avatar alt="Jane Smith" size="lg" />
      <Avatar alt="Jane Smith" size="xl" />
    </div>
  </section>

  <section class="dev-section">
    <h2>alt as meaningful name vs empty string</h2>
    <div class="dev-stage dev-stage--row">
      <!--
        alt="Jane Smith" — meaningful: role="img" aria-label="Jane Smith"
        on the span, screen readers announce the person's name.

        alt="" — decorative: role="img" has no aria-label,
        screen readers skip this avatar entirely. Use when the name
        appears in adjacent text so the avatar is purely visual.
      -->
      <div style="display: flex; flex-direction: column; align-items: center; gap: 0.25rem;">
        <Avatar src="https://i.pravatar.cc/150?img=2" alt="Bob Jones" size="lg" />
        <span style="font-size: 0.75rem;">alt="Bob Jones"</span>
      </div>
      <div style="display: flex; flex-direction: column; align-items: center; gap: 0.25rem;">
        <Avatar src="https://i.pravatar.cc/150?img=2" alt="" size="lg" />
        <span style="font-size: 0.75rem;">alt="" (decorative)</span>
      </div>
    </div>
  </section>

  <section class="dev-section">
    <h2>Fallback via explicit fallback prop</h2>
    <div class="dev-stage dev-stage--row">
      <Avatar fallback="AB" size="md" />
      <Avatar fallback="XY" size="md" />
    </div>
  </section>
</div>

<style>
  .dev-page { max-width: 40rem; }
  h1 { margin-block-end: 2rem; }
  .dev-section { margin-block-end: 2.5rem; }
  h2 { margin-block-end: 0.75rem; font-size: 0.875rem; font-weight: 600; }
  .dev-stage { padding: 1.5rem; border: 1px solid #ccc; border-radius: 0.375rem; }
  .dev-stage--row { display: flex; flex-wrap: wrap; gap: 1rem; align-items: center; }
</style>
