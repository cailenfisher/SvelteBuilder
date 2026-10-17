<!-- The item's link, menu, position and whether it shows: posts to this route's `update`
     action. Its label is copy, edited in the forms below it. -->
<script lang="ts">
  import './navigation-item-update-form.css';
  import { getDictionary } from 'diglossia/svelte';
  import { Button, Checkbox, Field, Input } from '@sveltebuilder/coreui';

  type Props = {
    navigationItem: { href: string; menu: string; position: number; active: boolean };
  };

  let { navigationItem }: Props = $props();

  const dictionary = getDictionary();
</script>

<form method="post" action="?/update" class="navigation-item-update-form">
  <div class="navigation-item-update-form__fields">
    <Field label={dictionary.localText('admin.navigation_item.href')} id="navigation-item-href" required>
      <Input id="navigation-item-href" name="href" value={navigationItem.href} required />
    </Field>
    <Field label={dictionary.localText('admin.navigation_item.menu')} id="navigation-item-menu" required>
      <Input id="navigation-item-menu" name="menu" value={navigationItem.menu} required />
    </Field>
    <Field label={dictionary.localText('admin.navigation_item.position')} id="navigation-item-position">
      <Input
        id="navigation-item-position"
        name="position"
        type="number"
        value={String(navigationItem.position)}
      />
    </Field>
  </div>
  <!-- Checkbox is self-labelling: it renders its own <label> around the control, so it takes
       the label directly rather than being wrapped in a Field. A Field here would nest one
       <label> inside another and leave the outer label's `for` pointing at no element. -->
  <Checkbox
    name="active"
    checked={navigationItem.active}
    label={dictionary.localText('admin.navigation_item.active')}
  />
  <Button type="submit">{dictionary.localText('action.save')}</Button>
</form>
