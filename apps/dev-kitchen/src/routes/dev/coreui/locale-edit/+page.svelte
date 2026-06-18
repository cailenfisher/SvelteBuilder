<script lang="ts">
  import { LocaleEdit } from '@sveltebuilder/coreui';
</script>

<svelte:head>
  <title>LocaleEdit — CoreUI Dev Kitchen</title>
</svelte:head>

<div class="dev-page">
  <h1>LocaleEdit</h1>

  <section class="dev-section">
    <h2>Empty (create new)</h2>
    <div class="dev-stage">
      <form>
        <LocaleEdit
          codeLabel="BCP-47 Code"
          nameLabel="English Name"
          nativeNameLabel="Native Name"
          dirLabel="Text Direction"
          ltrLabel="Left to right (LTR)"
          rtlLabel="Right to left (RTL)"
        />
      </form>
    </div>
  </section>

  <section class="dev-section">
    <h2>Pre-filled LTR locale (edit)</h2>
    <div class="dev-stage">
      <form>
        <LocaleEdit
          codeLabel="BCP-47 Code"
          nameLabel="English Name"
          nativeNameLabel="Native Name"
          dirLabel="Text Direction"
          ltrLabel="Left to right (LTR)"
          rtlLabel="Right to left (RTL)"
          code="fr"
          name="French"
          nativeName="Français"
          dir="ltr"
        />
      </form>
    </div>
  </section>

  <section class="dev-section">
    <h2>Pre-filled RTL locale (edit)</h2>
    <div class="dev-stage">
      <form>
        <LocaleEdit
          codeLabel="BCP-47 Code"
          nameLabel="English Name"
          nativeNameLabel="Native Name"
          dirLabel="Text Direction"
          ltrLabel="Left to right (LTR)"
          rtlLabel="Right to left (RTL)"
          code="ar"
          name="Arabic"
          nativeName="العربية"
          dir="rtl"
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
