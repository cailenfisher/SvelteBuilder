<!-- A dashboard preview of open work: each entry links to its own screen, with one line of
     detail beside it. The screen maps its receipts, pick tasks or returns to entries. -->
<script lang="ts">
  import './logistic-dashboard-link-list.css';

  type Props = {
    links: { href: string; label: string; detail: string }[];
  };

  let { links }: Props = $props();
</script>

<ul class="logistic-dashboard-link-list">
  {#each links as link (link.href)}
    <li class="logistic-dashboard-link-list__entry">
      <a href={link.href} class="logistic-dashboard-link-list__link">{link.label}</a>
      <span class="logistic-dashboard-link-list__detail">{link.detail}</span>
    </li>
  {/each}
</ul>
