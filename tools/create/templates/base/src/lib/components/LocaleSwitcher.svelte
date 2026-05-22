<script lang="ts">
  import type { Locale } from '@sveltebuilder/hermes'
  import { localText } from '@sveltebuilder/hermes'

  let {
    current,
    locales
  }: {
    current: Locale
    locales: Locale[]
  } = $props()
</script>

<!-- TODO: replace with @sveltebuilder/coreui LocaleSwitcher component -->
<form method="POST" action="/api/locale">
  <label for="locale-select" class="locale-switcher__label">
    {localText('locale.select')}
  </label>
  <select
    id="locale-select"
    name="code"
    class="locale-switcher__select"
    onchange={(e) => e.currentTarget.form?.submit()}
  >
    {#each locales as locale (locale.code)}
      <option value={locale.code} selected={locale.code === current.code}>
        {locale.nativeName}
      </option>
    {/each}
  </select>
</form>

<style>
  .locale-switcher__label {
    display: block;
    font-size: 0.75rem;
  }

  .locale-switcher__select {
    font-size: 0.875rem;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    border: 1px solid currentColor;
    background: transparent;
    cursor: pointer;
  }
</style>
