<script lang="ts">
  type LocaleOption = { code: string; nativeName: string };

  type Props = {
    label: string;
    current: LocaleOption;
    locales: LocaleOption[];
    action?: string;
    class?: string | undefined;
  };

  let {
    label,
    current,
    locales,
    action = '/api/locale',
    class: extraClass,
  }: Props = $props();

  const selectId = $props.id();
</script>

<form method="POST" {action} class={['locale-picker', extraClass ?? ''].filter(Boolean).join(' ')}>
  <label for={selectId} class="locale-picker__label">{label}</label>
  <select
    id={selectId}
    name="code"
    class="locale-picker__select"
    onchange={(e) => e.currentTarget.form?.submit()}
  >
    {#each locales as locale (locale.code)}
      <option value={locale.code} selected={locale.code === current.code}>
        {locale.nativeName}
      </option>
    {/each}
  </select>
</form>
