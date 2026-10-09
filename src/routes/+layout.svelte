<script lang="ts">
  import '@fontsource/manrope/latin-400.css';
  import '@fontsource/manrope/latin-500.css';
  import '@fontsource/manrope/latin-600.css';
  import '@fontsource/manrope/latin-700.css';
  import fontUrl from '@fontsource/manrope/files/manrope-latin-500-normal.woff2?url';
  import '#lib/styles.css';
  import { page } from '$app/state';
  import { published } from '#lib/published.ts';
  import SiteHeader from '#lib/components/SiteHeader.svelte';
  import SiteFooter from '#lib/components/SiteFooter.svelte';
  let { children } = $props();
  let admin = $derived(page.url.pathname.startsWith('/admin'));
</script>
<svelte:head><link rel="preload" href={fontUrl} as="font" type="font/woff2" crossorigin="anonymous" /></svelte:head>
<a href="#main" class="skip-link">Skip to content</a>
{#if !admin}<SiteHeader content={published} />{/if}
<main id="main" class:admin-main={admin}>{@render children()}</main>
{#if !admin}<SiteFooter content={published} />{/if}
