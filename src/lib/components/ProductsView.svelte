<script lang="ts">
  import { browser } from '$app/env';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { IconSearch, IconX, IconArrowRight } from '@tabler/icons-svelte';
  import type { SiteContent } from '#lib/types.ts';
  import { filterProducts, visibleCategories, visibleSubcategories } from '#lib/catalog.ts';
  import { storefrontHref } from '#lib/links.ts';
  import ProductCard from './ProductCard.svelte';
  let { content, preview = false, images = {} }: { content: SiteContent; preview?: boolean; images?: Record<string, string> } = $props();
  let params = $derived(browser ? page.url.searchParams : new URLSearchParams());
  let category = $derived(params.get('category') || ''); let subcategory = $derived(params.get('subcategory') || '');
  let search = $derived(params.get('q') || ''); let sort = $derived(params.get('sort') || 'featured');
  let searchInput = $state('');
  $effect(() => { searchInput = search; });
  let products = $derived(filterProducts(content, { category, subcategory, q: search, sort }));
  let currentCategory = $derived(visibleCategories(content).find(c => c.slug === category));
  let subs = $derived(visibleSubcategories(content).filter(s => !category || s.categoryId === currentCategory?.id));
  function update(values: Record<string, string>) {
    const next = new URL(page.url.href);
    for (const [key, value] of Object.entries(values)) { if (value) next.searchParams.set(key, value); else next.searchParams.delete(key); }
    goto(next.pathname + next.search, { replace: true, reset: false });
  }
  function categoryHref(value: string) { return storefrontHref(preview, '/products/', { ...(value ? { category: value } : {}), ...(search ? { q: search } : {}), ...(sort !== 'featured' ? { sort } : {}) }); }
</script>
<section class="catalog-page section">
  <div class="page-heading"><p class="eyebrow">The collection</p><h1>{currentCategory ? currentCategory.name : 'Find your kind of home.'}</h1><p>Considered pieces for living, gathering, and slowing down.</p></div>
  <nav class="category-tabs" aria-label="Product categories"><a href={categoryHref('')} class:active={!category}>All products</a>{#each visibleCategories(content) as item}<a href={categoryHref(item.slug)} class:active={category === item.slug}>{item.name}</a>{/each}</nav>
  <div class="catalog-toolbar">
    <form class="search-field" onsubmit={e => { e.preventDefault(); update({ q: searchInput }); }}><IconSearch size={19} stroke={1.5} /><label class="sr-only" for="product-search">Search products</label><input id="product-search" type="search" bind:value={searchInput} placeholder="Search the collection" /><button class="icon-button" type="submit" aria-label="Search"><IconArrowRight size={19} /></button></form>
    <div class="filter-select"><label for="subcategory">Type</label><select id="subcategory" value={subcategory} onchange={e => update({ subcategory: e.currentTarget.value })}><option value="">All types</option>{#each subs as sub}<option value={sub.id}>{sub.name}{!category && sub.id === 'chairs-dining' ? ' · Chairs' : ''}</option>{/each}</select></div>
    <div class="filter-select"><label for="sort">Sort by</label><select id="sort" value={sort} onchange={e => update({ sort: e.currentTarget.value })}><option value="featured">Collection order</option><option value="name">Name: A to Z</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option></select></div>
  </div>
  <div class="result-summary"><p aria-live="polite">{products.length} {products.length === 1 ? 'piece' : 'pieces'}{search ? ` matching “${search}”` : ''}</p>{#if search || subcategory || category}<a class="text-link" href={storefrontHref(preview, '/products/')}><IconX size={15} /> Clear filters</a>{/if}</div>
  {#if products.length}<div class="product-grid catalog-grid">{#each products as product}<ProductCard {product} {content} {preview} {images} />{/each}</div>{:else}<div class="empty-state"><h2>No pieces found.</h2><p>Try a different search or explore the whole collection.</p><a class="button secondary" href={storefrontHref(preview, '/products/')}>All products</a></div>{/if}
</section>
