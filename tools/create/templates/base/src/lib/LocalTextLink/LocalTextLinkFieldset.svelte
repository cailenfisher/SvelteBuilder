<!-- The inputs that identify a piece of copy, its slug and scope, grouped in a <fieldset>. Rendered
     inside a larger form, such as the one creating a navigation item, which owns the <form> and its
     submit button. -->
<script lang="ts">
  import './local-text-link.css';
  import { Field, Input } from '@sveltebuilder/coreui';

  type Props = {
    /** Names the group for assistive technology and shows as its caption. Omit when the
        surrounding form or section already names it. */
    legend?: string;
    slugLabel: string;
    scopeLabel: string;
    slug?: string;
    scope?: string | null;
  };

  let { legend, slugLabel, scopeLabel, slug = '', scope = '' }: Props = $props();

  const id = $props.id();
</script>

<fieldset class="local-text-link-fieldset">
  {#if legend}
    <legend class="local-text-link-fieldset__legend">{legend}</legend>
  {/if}
  <Field label={slugLabel} id="{id}-slug" required>
    <Input name="slug" value={slug} required />
  </Field>
  <Field label={scopeLabel} id="{id}-scope">
    <Input name="scope" value={scope ?? ''} />
  </Field>
</fieldset>
