<!-- Creates a group, named in the reader's locale: posts to this route's `create` action, which
     opens the new group to add its members. Whether it is external is fixed here, at creation,
     because an external group may only ever hold access to single rows. -->
<script lang="ts">
  import './user-group-create-form.css';
  import type { DictionaryInstance } from 'diglossia';
  import { Button, Checkbox, Field, Input } from '@sveltebuilder/coreui';

  let { dictionary }: { dictionary: DictionaryInstance } = $props();

  const localText = (slug: string) => dictionary.localText(slug, 'access');
</script>

<section class="user-group-create-form">
  <h2 class="user-group-create-form__title">{localText('access.user_group.new')}</h2>
  <form method="post" action="?/create" class="user-group-create-form__form">
    <Field label={localText('access.user_group.name')} id="user-group-name" required>
      <Input id="user-group-name" name="name" required />
    </Field>
    <div class="user-group-create-form__external">
      <Checkbox name="external" value="true" label={localText('access.user_group.external_label')} />
      <p class="user-group-create-form__hint">{localText('access.user_group.external_hint')}</p>
    </div>
    <Button type="submit">{localText('access.user_group.new')}</Button>
  </form>
</section>
