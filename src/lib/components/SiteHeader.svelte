<script lang="ts">
  import { imageSrc, imageSrcset } from '#lib/image-sizes.ts';
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { IconArrowUpRight, IconMenu2, IconX, IconSun, IconMoon } from '@tabler/icons-svelte';
  import type { SiteContent } from '#lib/types.ts';
  import { siteHref, storefrontHref } from '#lib/links.ts';
  let { content, preview = false, images = {} }: { content: SiteContent; preview?: boolean; images?: Record<string, string> } = $props();
  let open = $state(false); let dark = $state(false);
  onMount(() => { dark = document.documentElement.dataset.theme === 'dark'; });
  function toggleTheme() {
    dark = !dark;
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    try { localStorage.setItem('woodwork-theme', dark ? 'dark' : 'light'); } catch { /* Theme still works without persistence. */ }
  }
  const links = [['Home', '/'], ['Products', '/products/'], ['About us', '/about/'], ['Contact us', '/contact/']];
  function active(path: string) { return preview ? (page.url.searchParams.get('view') || 'home') === (path === '/' ? 'home' : path.replaceAll('/', '')) : path === '/' ? page.url.pathname === siteHref('/') : page.url.pathname.startsWith(siteHref(path)); }
</script>
<header class="site-header">
  <a class="wordmark" href={storefrontHref(preview, '/')} aria-label={`${content.settings.businessName} home`}>
    {#if content.settings.logo}<img src={imageSrc(content.settings.logo, images)} srcset={imageSrcset(content.settings.logo, images)} sizes="160px" alt={content.settings.logoAlt} width="160" height="40" />{:else}{content.settings.businessName.toLowerCase()}<span class="brand-period">.</span>{/if}
  </a>
  <nav class:mobile-open={open} aria-label="Main navigation">
    {#each links as [label, path]}<a href={storefrontHref(preview, path)} aria-current={active(path) ? 'page' : undefined} onclick={() => open = false}>{label}</a>{/each}
  </nav>
  <div class="header-actions">
    <button class="icon-button" onclick={toggleTheme} aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}>{#if dark}<IconSun size={20} stroke={1.5} />{:else}<IconMoon size={20} stroke={1.5} />{/if}</button>
    <a class="header-inquiry" href={storefrontHref(preview, '/contact/')}>Let’s talk <IconArrowUpRight size={18} stroke={1.5} /></a>
    <button class="icon-button mobile-toggle" aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} onclick={() => open = !open}>{#if open}<IconX size={23} />{:else}<IconMenu2 size={23} />{/if}</button>
  </div>
</header>
