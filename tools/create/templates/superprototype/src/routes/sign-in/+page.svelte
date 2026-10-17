<script lang="ts">
  import './sign-in-screen.css';
  import { Button } from '@sveltebuilder/coreui'
  import { getDictionary } from 'diglossia/svelte'
  import type { ActionData } from './$types'
  import { formErrorText } from '$lib/FormError/form-error';

  let { form }: { form: ActionData } = $props()

  const dictionary = getDictionary()

  const title = $derived(dictionary.localText('user.sign_in'))
  const subtitle = $derived(dictionary.localText('user.sign_in.subtitle'))
  const signInWithGoogle = $derived(dictionary.localText('user.sign_in_with_google'))
</script>

<div class="sign-in-screen">
  <div class="sign-in-screen__card">
    <header class="sign-in-screen__card-header">
      <h1 class="sign-in-screen__card-title">{title}</h1>
      <p class="sign-in-screen__card-subtitle">{subtitle}</p>
    </header>

    {#if form?.error}
      <p class="sign-in-screen__card-error" role="alert">{formErrorText(form.error, dictionary, dictionary)}</p>
    {/if}

    <form method="post">
      <Button type="submit" full>{signInWithGoogle}</Button>
    </form>
  </div>
</div>
