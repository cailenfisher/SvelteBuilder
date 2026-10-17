<!-- One block of the dashboard: a heading, a link to the full list it previews, and the
     preview itself. -->
<script lang="ts">
  import './logistic-dashboard-section.css';
  import type { Snippet } from 'svelte';
  import { getDictionary } from 'diglossia/svelte';
  import { Button } from '@sveltebuilder/coreui';

  type Props = {
    title: string;
    /** The full list this section previews. */
    href: string;
    children: Snippet;
  };

  let { title, href, children }: Props = $props();

  const globalDictionary = getDictionary();
</script>

<section class="logistic-dashboard-section">
  <div class="logistic-dashboard-section__header">
    <h2 class="logistic-dashboard-section__title">{title}</h2>
    <Button {href} variant="ghost" size="sm">
      {globalDictionary.localText('action.view_all')}
    </Button>
  </div>
  {@render children()}
</section>
