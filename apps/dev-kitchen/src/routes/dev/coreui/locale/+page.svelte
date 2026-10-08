<!-- The base template's admin routes render these editors against a real database, and
     scaffold:check type-checks them there; this page renders them, which nothing else
     does without a database. LocaleSwitcher posts to this app's /api/locale. -->
<script lang="ts">
  import { LocaleEdit, LocaleSwitcher, LocalTextEdit, LocalTextLinkEdit } from '@sveltebuilder/coreui';
  import { page } from '$app/state';
  import Example from '$lib/Example.svelte';
</script>

<div style:display="grid" style:gap="var(--space-2)" style:max-inline-size="32rem">
  <Example title="LocaleSwitcher">
    <LocaleSwitcher label="Language" current={page.data.locale} locales={page.data.locales} />
  </Example>

  <Example title="LocaleEdit, new">
    <LocaleEdit
      codeLabel="Code"
      nameLabel="Name"
      nativeNameLabel="Native name"
      dirLabel="Direction"
      ltrLabel="Left to right"
      rtlLabel="Right to left"
    />
  </Example>

  <Example title="LocaleEdit, existing right-to-left">
    <LocaleEdit
      codeLabel="Code"
      nameLabel="Name"
      nativeNameLabel="Native name"
      dirLabel="Direction"
      ltrLabel="Left to right"
      rtlLabel="Right to left"
      code="ar"
      name="Arabic"
      nativeName="العربية"
      dir="rtl"
    />
  </Example>

  <Example title="LocalTextLinkEdit">
    <LocalTextLinkEdit slugLabel="Slug" scopeLabel="Scope" slug="name" scope="supplier" />
  </Example>

  <Example title="LocalTextEdit">
    <LocalTextEdit
      slugLabel="Slug"
      localeLabel="Locale"
      contentLabel="Content"
      locales={page.data.locales}
      slug="app.name"
      localeId={2}
      content="Application SvelteBuilder"
      slugReadonly
    />
  </Example>
</div>
