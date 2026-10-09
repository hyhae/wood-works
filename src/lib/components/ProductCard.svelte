<script lang="ts">
  import { imageSrcset } from '#lib/image-sizes.ts';
  import { IconArrowUpRight } from '@tabler/icons-svelte';
  import type { Product, SiteContent } from '#lib/types.ts';
  import { priceLabel, productGroup } from '#lib/catalog.ts';
  import { storefrontHref } from '#lib/links.ts';
  let { product, content, preview = false, images = {} }: { product: Product; content: SiteContent; preview?: boolean; images?: Record<string, string> } = $props();
</script>
<a class="product-card" href={storefrontHref(preview, `/products/${product.slug}/`)}>
  <div class="product-image"><img src={images[product.images[0].src] || product.images[0].src} srcset={imageSrcset(product.images[0].src, images)} sizes="(max-width: 767px) 45vw, 30vw" alt={product.images[0].alt} width="1100" height="1100" loading="lazy" /></div>
  <div class="product-card-meta"><span>{productGroup(content, product)}</span><IconArrowUpRight size={18} stroke={1.5} /></div>
  <h3>{product.name}</h3><p class="price">{priceLabel(product.price, content.settings.currency)}</p>
</a>
