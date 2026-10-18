<!-- Promotes the user to administrator, or demotes them: posts to this route's `setAdmin` action,
     which goes through admin_set_user_admin() and is refused for the last administrator. -->
<script lang="ts">
  import './user-account-admin-form.css';
  import type { DictionaryInstance } from 'diglossia';
  import { Button } from '@sveltebuilder/coreui';

  let { admin, dictionary }: { admin: boolean; dictionary: DictionaryInstance } = $props();

  const localText = (slug: string) => dictionary.localText(slug, 'access');
</script>

<section class="user-account-admin-form">
  <h2 class="user-account-admin-form__title">{localText('access.user_account.admin')}</h2>
  <p class="user-account-admin-form__status">
    {localText(admin ? 'access.user_account.admin_yes' : 'access.user_account.admin_no')}
  </p>
  <p class="user-account-admin-form__hint">{localText('access.user_account.admin_hint')}</p>
  <form method="post" action="?/setAdmin">
    <input type="hidden" name="admin" value={admin ? 'false' : 'true'} />
    <Button type="submit" variant={admin ? 'danger' : 'secondary'} size="sm">
      {localText(admin ? 'access.user_account.admin_revoke' : 'access.user_account.admin_grant')}
    </Button>
  </form>
</section>
