<!-- Creates an administrator's role, named in the reader's locale: posts to this route's
     `create` action, which opens the new role to choose its permissions. -->
<script lang="ts">
  import './role-create-form.css';
  import type { DictionaryInstance } from 'diglossia';
  import { getDictionary } from 'diglossia/svelte';
  import { Button, Field, Input } from '@sveltebuilder/coreui';

  let { dictionary }: { dictionary: DictionaryInstance } = $props();

  const localText = (slug: string) => dictionary.localText(slug, 'access');
  const globalDictionary = getDictionary();
</script>

<section class="role-create-form">
  <h2 class="role-create-form__title">{localText('access.role.new')}</h2>
  <form method="post" action="?/create" class="role-create-form__form">
    <Field label={localText('access.role.name')} id="role-name" required>
      <Input id="role-name" name="name" required />
    </Field>
    <Button type="submit">{globalDictionary.localText('action.create')}</Button>
  </form>
</section>
