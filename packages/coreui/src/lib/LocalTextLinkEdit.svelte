<script lang="ts">
  import Field from './Field.svelte';
  import Input from './Input.svelte';

  type Props = {
    slugLabel: string;
    scopeLabel: string;
    slug?: string;
    scope?: string | null;
  };

  let { slugLabel, scopeLabel, slug = '', scope = '' }: Props = $props();
</script>

<div class="local-text-link-edit">
  <Field label={slugLabel} id="ltl-slug" required>
    <Input
      id="ltl-slug"
      name="slug"
      value={slug}
      placeholder="admin.nav.example"
      required
    />
  </Field>
  <Field label={scopeLabel} id="ltl-scope">
    <Input id="ltl-scope" name="scope" value={scope ?? ''} placeholder="blog, product, …" />
  </Field>
</div>

<style>
  .local-text-link-edit {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-4);
  }
</style>
