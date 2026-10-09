<script lang="ts">
  import { siteHref } from '#lib/links.ts';
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { IconArrowLeft } from '@tabler/icons-svelte';
  import type { SiteContent } from '#lib/types.ts';
  import { published } from '#lib/published.ts';
  import { loadDraft } from './storage';
  import { readableError } from './validation';
  import SiteHeader from '#lib/components/SiteHeader.svelte';
  import SiteFooter from '#lib/components/SiteFooter.svelte';
  import HomeView from '#lib/components/HomeView.svelte';
  import ProductsView from '#lib/components/ProductsView.svelte';
  import ProductView from '#lib/components/ProductView.svelte';
  import AboutView from '#lib/components/AboutView.svelte';
  import ContactView from '#lib/components/ContactView.svelte';
  let content = $state<SiteContent>(published); let images = $state<Record<string, string>>({});
  let loading = $state(true); let error = $state('');
  let view = $derived(page.url.searchParams.get('view') || 'home');
  let product = $derived(content.products.find(p => p.slug === page.url.searchParams.get('slug')));
  onMount(() => {
    const urls: string[] = [];
    loadDraft().then(draft => {
      if (draft) { content = draft.content; for (const [path, blob] of Object.entries(draft.assets)) { const url = URL.createObjectURL(blob); urls.push(url); images[path] = url; } }
    }).catch(e => error = readableError(e)).finally(() => loading = false);
    return () => urls.forEach(url => URL.revokeObjectURL(url));
  });
</script>
<svelte:head><title>Draft preview | {content.settings.businessName}</title></svelte:head>
<div class="preview-banner"><a href={siteHref('/admin/')}><IconArrowLeft size={16} /> Back to editor</a><span>Saved draft preview. The public website is unchanged.</span></div>
{#if loading}<div class="admin-loading"><div class="loading-block"></div><p>Reading your saved draft…</p></div>{:else if error}<div class="section"><p class="form-error" role="alert">{error}</p><a class="button secondary" href={siteHref('/admin/')}>Return to editor</a></div>{:else}
<SiteHeader {content} preview {images} />
{#if view === 'home'}<HomeView {content} preview {images} />{:else if view === 'products'}<ProductsView {content} preview {images} />{:else if view === 'about'}<AboutView {content} preview {images} />{:else if view === 'contact'}<ContactView {content} preview />{:else if view === 'product' && product}<ProductView {content} {product} preview {images} />{:else}<section class="section empty-state"><h1>Nothing to preview here.</h1><p>Save the product in the editor, then try again.</p><a class="button primary" href={siteHref('/admin/')}>Return to editor</a></section>{/if}
<SiteFooter {content} preview />
{/if}
