<script lang="ts">
  import { LocalTextEdit } from '@sveltebuilder/coreui';

  const mockLocales = [
    { id: 1, code: 'en', nativeName: 'English' },
    { id: 2, code: 'fr', nativeName: 'Français' },
    { id: 3, code: 'ar', nativeName: 'العربية' },
    { id: 4, code: 'pt-BR', nativeName: 'Português (Brasil)' },
  ];
</script>

<svelte:head>
  <title>LocalTextEdit — CoreUI Dev Kitchen</title>
</svelte:head>

<div class="dev-page">
  <h1>LocalTextEdit</h1>

  <section class="dev-section">
    <h2>Empty (create new translation)</h2>
    <div class="dev-stage">
      <form>
        <LocalTextEdit
          slugLabel="Key (slug)"
          localeLabel="Locale"
          contentLabel="Content"
          locales={mockLocales}
        />
      </form>
    </div>
  </section>

  <section class="dev-section">
    <h2>Pre-filled (edit existing)</h2>
    <div class="dev-stage">
      <form>
        <LocalTextEdit
          slugLabel="Key (slug)"
          localeLabel="Locale"
          contentLabel="Content"
          locales={mockLocales}
          slug="action.save"
          localeId={1}
          content="Save"
        />
      </form>
    </div>
  </section>

  <section class="dev-section">
    <h2>Slug readonly (editing a specific link's translation)</h2>
    <div class="dev-stage">
      <form>
        <LocalTextEdit
          slugLabel="Key (slug)"
          localeLabel="Locale"
          contentLabel="Content"
          locales={mockLocales}
          slug="product.title"
          localeId={2}
          content="Titre du produit"
          slugReadonly
        />
      </form>
    </div>
  </section>

  <section class="dev-section">
    <h2>Long-form content</h2>
    <div class="dev-stage">
      <form>
        <LocalTextEdit
          slugLabel="Key (slug)"
          localeLabel="Locale"
          contentLabel="Content"
          locales={mockLocales}
          slug="product.description"
          localeId={1}
          content="This premium product is crafted with care and attention to detail. It meets the highest standards of quality and is designed to last."
          slugReadonly
        />
      </form>
    </div>
  </section>
</div>

<style>
  .dev-page { max-width: 40rem; }
  h1 { margin-block-end: 2rem; }
  .dev-section { margin-block-end: 2.5rem; }
  h2 { margin-block-end: 0.75rem; font-size: 0.875rem; font-weight: 600; }
  .dev-stage { padding: 1.5rem; border: 1px solid #ccc; border-radius: 0.375rem; }
  form { display: contents; }
</style>
