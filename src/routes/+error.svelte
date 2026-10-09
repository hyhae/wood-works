<script lang="ts">
  import { siteHref } from '#lib/links.ts';
  import { page } from '$app/state';
</script>
<svelte:head><title>{page.status} | Page unavailable</title></svelte:head>
<section class="section empty-state"><p class="eyebrow">{page.status}</p><h1>This page has moved on.</h1><p>{page.error?.message || 'We could not find the page you are looking for.'}</p><a class="button primary" href={siteHref('/products/')}>Explore products</a></section>
