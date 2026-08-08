# @sveltebuilder/hermes

Framework-agnostic i18n primitives for [SvelteBuilder](https://github.com/cailenfisher/SvelteBuilder). Hermes is a pure, synchronous, in-memory dictionary store — it has no database calls, no `fetch`, and no async of any kind. Your app loads translated content from wherever it lives and hands it to hermes; hermes only resolves lookups.

## Install

```sh
npm install @sveltebuilder/hermes
```

Requires Svelte 5.

## Usage

Load a dictionary payload once (typically in your root layout, after fetching it from your database):

```ts
import { load } from '@sveltebuilder/hermes';

load(dictionaryPayload, userLocaleCode, fallbackLocaleCode);
```

Read values with `localText`, or render them with the `<LocalText />` component:

```svelte
<script lang="ts">
  import { localText, LocalText } from '@sveltebuilder/hermes';
</script>

<h1>{localText('app.title')}</h1>
<LocalText slug="buy_label" scope="product" entityId={product.id} />
```

`localText(slug, scope?, entityId?)` resolves a dictionary key built from those three parts:

| Call                                      | Key                         |
| ------------------------------------------ | ---------------------------- |
| `localText('app.title')`                   | `app.title`                  |
| `localText('buy_label', 'product')`        | `product:buy_label`          |
| `localText('product.title', 'product', 42)`| `product:product.title:42`   |

`scope` is omitted for global/application-level copy and set to the owning entity's table/model name for entity-bound copy.

## API

- `load(payload, userLocaleCode, fallbackLocaleCode)` — replaces the entire in-memory dictionary. Resolves each key by locale priority: user locale → fallback locale → first available.
- `merge(payload, userLocaleCode, fallbackLocaleCode)` — resolves and merges additional entries into the existing dictionary without clearing it (useful for lazy-loading entity copy on route navigation).
- `localText(slug, scope?, entityId?)` — reads a resolved string from the dictionary.
- `<LocalText slug scope? entityId? />` — Svelte component wrapper around `localText`.

### Types

`Locale`, `LocalText` (record shape, re-exported as `LocalTextRecord` to avoid clashing with the component), `LocalTextLink`, `Dictionary`, `DictionaryPayload`.

## Part of the SvelteBuilder ecosystem

Hermes is the single source of i18n primitives shared across every SvelteBuilder package — `@sveltebuilder/coreui` and all domain modules import types and `localText` from here rather than redeclaring them. See the [SvelteBuilder README](https://github.com/cailenfisher/SvelteBuilder) for the full architecture.
