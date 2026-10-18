<!-- Makes an administrator's copy of this role, with the same permissions, to change freely:
     posts to this route's `clone` action. The only way to customise a module's role. -->
<script lang="ts">
  import './role-clone-form.css';
  import type { DictionaryInstance } from 'diglossia';
  import { Button, Field, Input } from '@sveltebuilder/coreui';

  let { roleName, dictionary }: { roleName: string; dictionary: DictionaryInstance } = $props();

  const localText = (slug: string) => dictionary.localText(slug, 'access');
</script>

<section class="role-clone-form">
  <h2 class="role-clone-form__title">{localText('access.role.clone')}</h2>
  <form method="post" action="?/clone" class="role-clone-form__form">
    <Field label={localText('access.role.clone_name')} id="role-clone-name" required>
      <Input
        id="role-clone-name"
        name="name"
        value={dictionary.formatText('access.role.clone_default_name', { role: roleName }, 'access')}
        required
      />
    </Field>
    <Button type="submit" variant="secondary">{localText('access.role.clone')}</Button>
  </form>
</section>
