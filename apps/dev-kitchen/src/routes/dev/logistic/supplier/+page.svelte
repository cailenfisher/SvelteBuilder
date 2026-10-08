<script lang="ts">
  import { SupplierCard } from '@sveltebuilder/logistic';
  import Example from '$lib/Example.svelte';
  import { CONTACTS, SUPPLIERS, logisticDictionary } from '$lib/fixtures/logistic';

  const dictionary = logisticDictionary();
</script>

<Example title="With contacts and a link">
  <div style:inline-size="min(100%, 28rem)">
    <SupplierCard supplier={SUPPLIERS[0]} contacts={CONTACTS} href="#acme-freight" {dictionary} />
  </div>
</Example>

<Example title="Inactive, no lead time, no contacts">
  <div style:inline-size="min(100%, 28rem)">
    <SupplierCard supplier={SUPPLIERS[1]} {dictionary} />
  </div>
</Example>
