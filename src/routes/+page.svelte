<script lang="ts">
  import { published } from '#lib/published.ts';
  import HomeView from '#lib/components/HomeView.svelte';
  import Seo from '#lib/components/Seo.svelte';
</script>
<Seo title={`${published.settings.businessName} | Considered furniture. Everyday living.`} description={published.settings.heroText} image={published.settings.heroImage} />
<HomeView content={published} />
