<script lang="ts">
  import { imageSrc, imageSrcset } from '#lib/image-sizes.ts';
  import { browser } from '$app/env';
  import { page } from '$app/state';
  import { IconArrowLeft, IconBrandWhatsapp, IconMail, IconPhone, IconChevronRight } from '@tabler/icons-svelte';
  import type { SiteContent, Product } from '#lib/types.ts';
  import { catalogProducts, priceLabel, inquiryLinks, productGroup } from '#lib/catalog.ts';
  import { siteHref, storefrontHref } from '#lib/links.ts';
  import ProductCard from './ProductCard.svelte';
  let { content, product, preview = false, images = {} }: { content: SiteContent; product: Product; preview?: boolean; images?: Record<string, string> } = $props();
  let selected = $state(0);
  $effect(() => { product.id; selected = 0; });
  let photo = $derived(product.images[selected] || product.images[0]);
  let contacts = $derived(inquiryLinks(content, product, browser ? `${page.url.origin}${siteHref(`/products/${product.slug}/`)}` : siteHref(`/products/${product.slug}/`)));
  let related = $derived(catalogProducts(content).filter(p => p.id !== product.id && p.subcategoryIds.some(id => product.subcategoryIds.includes(id))).slice(0, 4));
</script>
<section class="section product-detail"><a class="back-link" href={storefrontHref(preview, '/products/')}><IconArrowLeft size={17} /> Back to collection</a>
  <div class="product-detail-grid"><div class="product-gallery"><div class="gallery-main"><img src={imageSrc(photo.src, images)} srcset={imageSrcset(photo.src, images)} sizes="(max-width: 767px) 90vw, 50vw" alt={photo.alt} width="1100" height="1100" fetchpriority="high" /></div>{#if product.images.length > 1}<div class="gallery-thumbnails">{#each product.images as image, i}<button class:selected={selected === i} aria-label={`View image ${i + 1}: ${image.alt}`} aria-pressed={selected === i} onclick={() => selected = i}><img src={imageSrc(image.src, images)} srcset={imageSrcset(image.src, images)} sizes="76px" alt="" width="100" height="100" /></button>{/each}</div>{/if}</div>
  <div class="product-info"><p class="eyebrow">{productGroup(content, product)}</p><h1>{product.name}</h1><p class="detail-price">{priceLabel(product.price, content.settings.currency)}</p><p class="product-description">{product.description}</p>
    <dl class="specifications">{#each [['Dimensions', product.dimensions], ['Materials', product.materials], ['Finishes', product.finishes]] as [name, value]}{#if value}<div><dt>{name}</dt><dd>{value}</dd></div>{/if}{/each}</dl>
    <div class="inquiry-actions">{#if contacts.whatsapp}<a class="button primary" href={contacts.whatsapp} target="_blank" rel="noreferrer"><IconBrandWhatsapp size={20} /> Inquire on WhatsApp</a>{/if}{#if contacts.email}<a class="button secondary" href={contacts.email}><IconMail size={19} /> Email about this piece</a>{/if}{#if contacts.phone}<a class="text-link" href={contacts.phone}><IconPhone size={17} /> {content.settings.phone}</a>{/if}{#if !contacts.whatsapp && !contacts.email && !contacts.phone}<a class="button primary" href={storefrontHref(preview, '/contact/')}>Contact us <IconChevronRight size={18} /></a><p class="helper">Contact details will be available soon.</p>{/if}</div>
    {#if content.settings.sampleNotice}<p class="helper">Sample product, imagery, specifications, and price.</p>{/if}
  </div></div>
</section>
{#if related.length}<section class="section related-section"><div class="section-heading"><h2>In good company.</h2><p>More pieces from the same collection.</p></div><div class="product-grid">{#each related as item}<ProductCard product={item} {content} {preview} {images} />{/each}</div></section>{/if}
