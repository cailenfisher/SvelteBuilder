<script lang="ts">
  type LocaleOption = { code: string; nativeName: string };

  type Props = {
    label: string;
    current: LocaleOption;
    locales: LocaleOption[];
    action?: string;
  };

  let {
    label,
    current,
    locales,
    action = '/api/locale',
  }: Props = $props();
</script>

<form method="POST" {action} class="locale-switcher">
  <label for="locale-switcher-select" class="locale-switcher__label">{label}</label>
  <select
    id="locale-switcher-select"
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
  .locale-switcher {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .locale-switcher__label {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
    white-space: nowrap;
    cursor: default;
  }

  .locale-switcher__select {
    font-size: var(--text-sm);
    height: var(--select-height-sm);
    padding: 0 var(--input-padding-x);
    border: var(--input-border-width) solid var(--input-border);
    border-radius: var(--select-radius);
    background-color: var(--input-bg);
    color: var(--input-text);
    font-family: var(--font-sans);
    cursor: pointer;
    appearance: auto;
    transition: border-color var(--input-transition);
  }

  .locale-switcher__select:focus-visible {
    outline: none;
    border-color: var(--input-border-focus);
    box-shadow: 0 0 0 var(--focus-ring-width)
      color-mix(in srgb, var(--color-focus-ring) 30%, transparent);
  }

  .locale-switcher__select:hover {
    border-color: var(--input-border-focus);
  }
</style>
