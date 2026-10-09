<script lang="ts">
  import { imageSrc } from '#lib/image-sizes.ts';
  let { title, description, image = '', noindex = false }: { title: string; description: string; image?: string; noindex?: boolean } = $props();
</script>
<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:type" content="website" />
  {#if image}<meta property="og:image" content={imageSrc(image)} />{/if}
  <meta name="twitter:card" content="summary_large_image" />
  {#if noindex}<meta name="robots" content="noindex, nofollow" />{/if}
</svelte:head>
