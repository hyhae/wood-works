<script lang="ts">
  import { IconArrowRight, IconArrowUpRight } from '@tabler/icons-svelte';
  import type { SiteContent } from '#lib/types.ts';
  import { catalogProducts, visibleCategories } from '#lib/catalog.ts';
  import { storefrontHref } from '#lib/links.ts';
  import ProductCard from './ProductCard.svelte';
  import { imageSrcset } from '#lib/image-sizes.ts';
  let { content, preview = false, images = {} }: { content: SiteContent; preview?: boolean; images?: Record<string, string> } = $props();
  let featured = $derived(catalogProducts(content).filter(p => p.featured).slice(0, 4));
</script>
<section class="home-hero">
  <div class="hero-copy"><p class="eyebrow">Living, thoughtfully.</p><h1>{content.settings.heroTitle}</h1><p class="hero-description">{content.settings.heroText}</p><a class="button primary" href={storefrontHref(preview, '/products/')}>Explore products <IconArrowRight size={19} stroke={1.5} /></a></div>
  <div class="hero-image"><img src={images[content.settings.heroImage] || content.settings.heroImage} srcset={imageSrcset(content.settings.heroImage, images)} sizes="(max-width: 767px) 100vw, 60vw" alt={content.settings.heroImageAlt} width="1536" height="1024" fetchpriority="high" /></div>
</section>
<section class="section collection-section">
  <div class="section-heading"><h2>Room for every day.</h2><p>Find your next piece, one space at a time.</p></div>
  <div class="category-grid">{#each visibleCategories(content) as category}<a class="category-tile" href={storefrontHref(preview, '/products/', { category: category.slug })}><div class="category-photo"><img src={images[category.image || content.settings.heroImage] || category.image || content.settings.heroImage} srcset={imageSrcset(category.image || content.settings.heroImage, images)} sizes="(max-width: 767px) 45vw, 23vw" alt={category.image ? category.imageAlt : category.name} width="1100" height="1100" loading="lazy" /></div><div><h3>{category.name}</h3><IconArrowUpRight size={20} stroke={1.5} /></div></a>{/each}</div>
</section>
{#if featured.length}<section class="section featured-section"><div class="section-heading heading-with-link"><div><h2>A few favorites.</h2><p>Simple forms with a character of their own.</p></div><a class="text-link" href={storefrontHref(preview, '/products/')}>All products <IconArrowRight size={18} /></a></div><div class="product-grid">{#each featured as product}<ProductCard {product} {content} {preview} {images} />{/each}</div></section>{/if}
<section class="material-section"><div class="material-image"><img src={images[content.settings.aboutImage] || content.settings.aboutImage} srcset={imageSrcset(content.settings.aboutImage, images)} sizes="(max-width: 767px) 90vw, 46vw" alt={content.settings.aboutImageAlt} width="1100" height="1100" loading="lazy" /></div><div class="material-copy"><h2>{content.settings.homeIntroTitle}</h2><p>{content.settings.homeIntroText}</p><a class="text-link" href={storefrontHref(preview, '/about/')}>Our story <IconArrowUpRight size={19} /></a></div></section>
