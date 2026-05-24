<script lang="ts">
  import { messageBus } from './message-bus.svelte.js';

  // These two regions are the only aria-live regions in the app.
  // Toasts and banners are announced here; InlineNotification uses
  // its own role="alert" / role="status" since it is already in the DOM flow.
  let politeText = $state('');
  let assertiveText = $state('');

  let lastToastId = '';
  let lastBannerId = '';

  // Inject text then clear after 700 ms so the same text can fire again next time.
  function announcePolite(text: string) {
    politeText = text;
    setTimeout(() => {
      politeText = '';
    }, 700);
  }

  function announceAssertive(text: string) {
    assertiveText = text;
    setTimeout(() => {
      assertiveText = '';
    }, 700);
  }

  $effect(() => {
    const latest = messageBus.toasts.at(-1);
    if (!latest || latest.id === lastToastId) return;
    lastToastId = latest.id;

    if (latest.severity === 'error' || latest.severity === 'critical') {
      announceAssertive(latest.summary);
    } else {
      announcePolite(latest.summary);
    }
  });

  $effect(() => {
    const banner = messageBus.banner;
    if (!banner || banner.id === lastBannerId) return;
    lastBannerId = banner.id;

    if (banner.severity === 'error' || banner.severity === 'critical') {
      announceAssertive(banner.summary);
    } else {
      announcePolite(banner.summary);
    }
  });
</script>

<!--
  Two static ARIA live regions, mounted once at app boot in the root layout.
  Must be present in the DOM before any messages are dispatched.
  Visually hidden — announcements are for assistive technology only.
-->
<div id="sb-live-polite" aria-live="polite" aria-atomic="true" class="aria-live">
  {politeText}
</div>
<div id="sb-live-assertive" aria-live="assertive" aria-atomic="true" class="aria-live">
  {assertiveText}
</div>

<style>
  .aria-live {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
</style>
