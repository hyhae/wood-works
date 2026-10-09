<script lang="ts">
  import { published } from '#lib/published.ts';
  import ContactView from '#lib/components/ContactView.svelte';
  import Seo from '#lib/components/Seo.svelte';
</script>
<Seo title={`Contact us | ${published.settings.businessName}`} description={`Contact ${published.settings.businessName} to discuss furniture, materials, dimensions, and your space.`} />
<ContactView content={published} />
