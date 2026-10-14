<script lang="ts">
  import './navigation-item-admin-detail-screen.css';
  import { getDictionary } from 'diglossia/svelte'
  import { Button, Field, Input, Checkbox } from '@sveltebuilder/coreui'
  import LocalTextFieldset from '$lib/LocalText/LocalTextFieldset.svelte'
  import type { PageData, ActionData } from './$types'

  let { data, form }: { data: PageData; form: ActionData } = $props()

  const dictionary = getDictionary()

  const editLabel  = $derived(dictionary.localText('admin.navigation_item.edit'))
  const hrefLabel  = $derived(dictionary.localText('admin.navigation_item.href'))
  const menuLabel  = $derived(dictionary.localText('admin.navigation_item.menu'))
  const positionLabel  = $derived(dictionary.localText('admin.navigation_item.position'))
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
    <p class="navigation-item-admin-detail-screen__error" role="alert">{form.error}</p>
  {/if}
  {#if form?.success}
    <p class="navigation-item-admin-detail-screen__success" role="status">{dictionary.localText('feedback.saved')}</p>
  {/if}

  <section class="navigation-item-admin-detail-screen__section">
    <h2 class="navigation-item-admin-detail-screen__section-title">{dictionary.localText('admin.navigation_item.edit')}</h2>
    <form method="post" action="?/update" class="navigation-item-admin-detail-screen__form">
      <div class="navigation-item-admin-detail-screen__form-row">
        <Field label={hrefLabel} id="navigation-item-href" required>
          <Input id="navigation-item-href" name="href" value={data.navigationItem.href} required />
        </Field>
        <Field label={menuLabel} id="navigation-item-menu" required>
          <Input id="navigation-item-menu" name="menu" value={data.navigationItem.menu} required />
        </Field>
        <Field label={positionLabel} id="navigation-item-position">
          <Input id="navigation-item-position" name="position" type="number" value={String(data.navigationItem.position)} />
        </Field>
      </div>
      <!-- Checkbox is self-labelling: it renders its own <label> around the control,
           so it takes the label directly rather than being wrapped in a Field. A
           Field here would nest one <label> inside another and leave the outer
           label's `for` pointing at no element. -->
      <Checkbox
        name="active"
        checked={data.navigationItem.active}
        label={dictionary.localText('admin.navigation_item.active')}
      />
      <Button type="submit">{dictionary.localText('action.save')}</Button>
    </form>
  </section>

  <section class="navigation-item-admin-detail-screen__section">
    <h2 class="navigation-item-admin-detail-screen__section-title">{dictionary.localText('admin.local_text.title')}</h2>
    <div class="navigation-item-admin-detail-screen__translations">
      {#each data.locales as locale (locale.id)}
        <form method="post" action="?/updateText" class="navigation-item-admin-detail-screen__locale-form">
          <LocalTextFieldset
            {slugLabel}
            localeLabel={locale.nativeName}
            contentLabel={dictionary.localText('admin.local_text.content')}
            locales={[locale]}
            slug={data.navigationItem.localTextLink?.slug ?? ''}
            localeId={locale.id}
            content={translationFor(locale.id)}
            slugReadonly={true}
          />
          <Button type="submit" size="sm">{dictionary.localText('action.save')}</Button>
        </form>
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
