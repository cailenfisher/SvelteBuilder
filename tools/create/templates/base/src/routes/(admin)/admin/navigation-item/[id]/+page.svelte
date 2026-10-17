<script lang="ts">
  import './navigation-item-admin-detail-screen.css';
  import { getDictionary } from 'diglossia/svelte'
  import { Button } from '@sveltebuilder/coreui'
  import LocalTextForm from '$lib/LocalText/LocalTextForm.svelte'
  import NavigationItemUpdateForm from './NavigationItemUpdateForm.svelte'
  import type { PageData, ActionData } from './$types'
  import { formErrorText } from '$lib/FormError/form-error';

  let { data, form }: { data: PageData; form: ActionData } = $props()

  const dictionary = getDictionary()

  const editLabel  = $derived(dictionary.localText('admin.navigation_item.edit'))
  const hrefLabel  = $derived(dictionary.localText('admin.navigation_item.href'))
  const slugLabel  = $derived(dictionary.localText('admin.local_text.slug'))

  function translationFor(localeId: number): string {
    return data.translations.find((t) => t.locale === localeId)?.content ?? ''
  }
</script>

<div class="navigation-item-admin-detail-screen">
  <header class="navigation-item-admin-detail-screen__header">
    <Button href="/admin/navigation-item" variant="ghost" size="sm">← {dictionary.localText('navigation.back')}</Button>
    <h1 class="navigation-item-admin-detail-screen__title">{editLabel}</h1>
  </header>

  <dl class="navigation-item-admin-detail-screen__meta">
    <dt class="navigation-item-admin-detail-screen__meta-term">{slugLabel}</dt>
    <dd><code class="navigation-item-admin-detail-screen__meta-code">{data.navigationItem.localTextLink?.slug ?? '—'}</code></dd>
    <dt class="navigation-item-admin-detail-screen__meta-term">{hrefLabel}</dt>
    <dd>{data.navigationItem.href}</dd>
  </dl>

  {#if form?.error}
    <p class="navigation-item-admin-detail-screen__error" role="alert">{formErrorText(form.error, dictionary, dictionary)}</p>
  {/if}
  {#if form?.success}
    <p class="navigation-item-admin-detail-screen__success" role="status">{dictionary.localText('feedback.saved')}</p>
  {/if}

  <section class="navigation-item-admin-detail-screen__section">
    <h2 class="navigation-item-admin-detail-screen__section-title">{dictionary.localText('admin.navigation_item.edit')}</h2>
    <NavigationItemUpdateForm navigationItem={data.navigationItem} />
  </section>

  <section class="navigation-item-admin-detail-screen__section">
    <h2 class="navigation-item-admin-detail-screen__section-title">{dictionary.localText('admin.local_text.title')}</h2>
    <div class="navigation-item-admin-detail-screen__translations">
      {#each data.locales as locale (locale.id)}
        <LocalTextForm
          action="?/updateText"
          slug={data.navigationItem.localTextLink?.slug ?? ''}
          {locale}
          content={translationFor(locale.id)}
        />
      {/each}
    </div>
  </section>

  <div class="navigation-item-admin-detail-screen__danger">
    <form method="post" action="?/delete">
      <Button type="submit" variant="danger" size="sm">
        {dictionary.localText('action.delete')} {editLabel}
      </Button>
    </form>
  </div>
</div>
