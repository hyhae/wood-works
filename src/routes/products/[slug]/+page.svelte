<script lang="ts">
  import { published } from '#lib/published.ts';
  import ProductView from '#lib/components/ProductView.svelte';
  import Seo from '#lib/components/Seo.svelte';
  import type { PageData } from './$types';
  let { data }: { data: PageData } = $props();
</script>
<Seo title={`${data.product.name} | ${published.settings.businessName}`} description={data.product.description} image={data.product.images[0].src} />
<ProductView content={published} product={data.product} />
