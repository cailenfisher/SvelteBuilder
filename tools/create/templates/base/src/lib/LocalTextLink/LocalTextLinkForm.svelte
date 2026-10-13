<!-- The fields that identify a piece of copy: its slug and scope. Rendered inside a larger form,
     such as the one creating a navigation item, which supplies the <form> and its submit button. -->
<script lang="ts">
  import { Field, Input } from '@sveltebuilder/coreui';

  type Props = {
    slugLabel: string;
    scopeLabel: string;
    slug?: string;
    scope?: string | null;
  };

  let { slugLabel, scopeLabel, slug = '', scope = '' }: Props = $props();

  const id = $props.id();
</script>

<div class="local-text-link-form">
  <Field label={slugLabel} id="{id}-slug" required>
    <Input name="slug" value={slug} required />
  </Field>
  <Field label={scopeLabel} id="{id}-scope">
    <Input name="scope" value={scope ?? ''} />
  </Field>
</div>

<style>
  .local-text-link-form {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-4);
  }
</style>
