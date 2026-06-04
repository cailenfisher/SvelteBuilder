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
  <label for="locale-switcher-select" class="label">{label}</label>
  <select
    id="locale-switcher-select"
    name="code"
    class="select"
    onchange={(e) => e.currentTarget.form?.submit()}
  >
    {#each locales as locale (locale.code)}
      <option value={locale.code} selected={locale.code === current.code}>
        {locale.nativeName}
      </option>
    {/each}
  </select>
</form>