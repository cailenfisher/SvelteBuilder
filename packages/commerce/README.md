# @sveltebuilder/commerce

Commerce domain module for [SvelteBuilder](https://github.com/cailenfisher/SvelteBuilder) — planned scope: product catalog, cart, checkout, and order management, following the same i18n and schema conventions as every other domain module.

> [!NOTE]
> **Not yet implemented.** This package name is reserved on npm; the module has not been built. Follow the [SvelteBuilder README](https://github.com/cailenfisher/SvelteBuilder) for roadmap status before depending on it.

## Planned v1 scope

Standard single-vendor storefront workflows: catalog, cart, checkout, orders.

**Explicitly out of scope for v1:** marketplace/multi-vendor, subscriptions/recurring billing, advanced B2B (customer groups, RFQ/PO, net terms), PIM, and a tax calculation engine.

## Install

```sh
npm install @sveltebuilder/commerce
```

Requires Svelte 5. Once implemented, it will follow the same shape as [`@sveltebuilder/content`](https://github.com/cailenfisher/SvelteBuilder/tree/main/packages/content) and [`@sveltebuilder/logistic`](https://github.com/cailenfisher/SvelteBuilder/tree/main/packages/logistic) — components, a `/server` query API, and a `/schema` export of Drizzle table definitions.
