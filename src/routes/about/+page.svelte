<script lang="ts">
  import { published } from '#lib/published.ts';
  import AboutView from '#lib/components/AboutView.svelte';
  import Seo from '#lib/components/Seo.svelte';
</script>
<Seo title={`About us | ${published.settings.businessName}`} description={published.settings.homeIntroText} image={published.settings.aboutImage} />
<AboutView content={published} />
