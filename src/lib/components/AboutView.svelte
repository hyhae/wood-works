<script lang="ts">
  import { imageSrcset } from '#lib/image-sizes.ts';
  import { IconArrowUpRight } from '@tabler/icons-svelte';
  import type { SiteContent } from '#lib/types.ts';
  import { storefrontHref } from '#lib/links.ts';
  let { content, preview = false, images = {} }: { content: SiteContent; preview?: boolean; images?: Record<string, string> } = $props();
</script>
<section class="section about-page"><div class="page-heading"><p class="eyebrow">About {content.settings.businessName}</p><h1>{content.settings.aboutTitle}</h1></div><div class="about-grid"><div class="about-photo"><img src={images[content.settings.aboutImage] || content.settings.aboutImage} srcset={imageSrcset(content.settings.aboutImage, images)} sizes="(max-width: 767px) 90vw, 46vw" alt={content.settings.aboutImageAlt} width="1100" height="1100" fetchpriority="high" /></div><div class="about-copy">{#each content.settings.aboutText.split(/\n\s*\n/) as paragraph}<p>{paragraph}</p>{/each}<a class="text-link" href={storefrontHref(preview, '/products/')}>Explore products <IconArrowUpRight size={19} /></a></div></div></section>
