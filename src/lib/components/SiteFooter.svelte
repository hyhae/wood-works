<script lang="ts">
  import { IconBrandFacebook, IconBrandInstagram, IconArrowUpRight } from '@tabler/icons-svelte';
  import type { SiteContent } from '#lib/types.ts';
  import { visibleCategories, visibleSubcategories, inquiryLinks } from '#lib/catalog.ts';
  import { storefrontHref } from '#lib/links.ts';
  let { content, preview = false }: { content: SiteContent; preview?: boolean } = $props();
  let contacts = $derived(inquiryLinks(content));
</script>
<footer class="site-footer">
  <div class="footer-top">
    <div class="footer-brand"><a class="wordmark" href={storefrontHref(preview, '/')}>{content.settings.businessName.toLowerCase()}<span class="brand-period">.</span></a><p>{content.settings.footerText}</p><a class="text-link" href={storefrontHref(preview, '/about/')}>Our story <IconArrowUpRight size={17} /></a></div>
    <div class="footer-catalog"><h2>Explore the collection</h2><div class="footer-category-grid">
      {#each visibleCategories(content) as category}<div><a class="footer-category-name" href={storefrontHref(preview, '/products/', { category: category.slug })}>{category.name}</a>{#each visibleSubcategories(content).filter(s => s.categoryId === category.id) as sub}<a href={storefrontHref(preview, '/products/', { category: category.slug, subcategory: sub.id })}>{sub.name}</a>{/each}</div>{/each}
    </div></div>
    <div class="footer-contact"><h2>Get in touch</h2>{#if contacts.email}<a href={contacts.email}>{content.settings.email}</a>{/if}{#if contacts.phone}<a href={contacts.phone}>{content.settings.phone}</a>{/if}{#if content.settings.address}<p>{content.settings.address}</p>{/if}{#if !contacts.email && !contacts.phone && !content.settings.address}<p>Contact details coming soon.</p>{/if}<a class="text-link" href={storefrontHref(preview, '/contact/')}>Contact us <IconArrowUpRight size={17} /></a></div>
  </div>
  <div class="footer-bottom"><span>© {new Date().getFullYear()} {content.settings.businessName}</span><div class="social-links">
    {#if content.settings.facebook}<a href={content.settings.facebook} target="_blank" rel="noreferrer"><IconBrandFacebook size={17} /> Facebook</a>{:else}<span><IconBrandFacebook size={17} /> Facebook <small>Coming soon</small></span>{/if}
    {#if content.settings.instagram}<a href={content.settings.instagram} target="_blank" rel="noreferrer"><IconBrandInstagram size={17} /> Instagram</a>{:else}<span><IconBrandInstagram size={17} /> Instagram <small>Coming soon</small></span>{/if}
  </div></div>
  {#if content.settings.sampleNotice}<p class="sample-notice">Sample collection. Images, specifications, and prices are illustrative.</p>{/if}
</footer>
