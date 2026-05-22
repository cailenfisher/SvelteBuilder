// bits-ui uses .svelte.js rune files that Vite 8's SSR module runner
// cannot execute without the Svelte compiler. This dev kitchen is
// client-only — SSR is not needed here.
export const ssr = false;
