<script lang="ts">
  import { published } from '#lib/published.ts';
  import ProductsView from '#lib/components/ProductsView.svelte';
  import Seo from '#lib/components/Seo.svelte';
</script>
<Seo title={`Products | ${published.settings.businessName}`} description="Explore coffee tables, dining furniture, beds, chairs, and wooden accessories. Browse the collection and contact us about your favorite piece." image={published.settings.heroImage} />
<ProductsView content={published} />
