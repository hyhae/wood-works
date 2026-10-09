<script lang="ts">
  import { siteHref } from '#lib/links.ts';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { IconArrowLeft, IconLogout, IconLock, IconArrowRight } from '@tabler/icons-svelte';
  import type { Snippet } from 'svelte';
  import { DEMO_CREDENTIALS, SESSION_KEY } from './credentials';
  let { children }: { children: Snippet } = $props();
  let ready = $state(false); let unlocked = $state(false);
  let username = $state(''); let password = $state(''); let error = $state('');
  onMount(() => {
    try { unlocked = sessionStorage.getItem(SESSION_KEY) === 'true'; }
    catch { error = 'Enable session storage in your browser to use this editor.'; }
    ready = true;
  });
  function login(event: SubmitEvent) {
    event.preventDefault(); error = '';
    if (username !== DEMO_CREDENTIALS.username || password !== DEMO_CREDENTIALS.password) { error = 'Incorrect username or password.'; return; }
    try { sessionStorage.setItem(SESSION_KEY, 'true'); unlocked = true; password = ''; }
    catch { error = 'Enable session storage in your browser to use this editor.'; }
  }
  function logout() {
    if (!window.dispatchEvent(new CustomEvent('woodwork-before-logout', { cancelable: true }))) return;
    try { sessionStorage.removeItem(SESSION_KEY); } catch { /* Login gate is still reset. */ }
    unlocked = false; username = ''; password = ''; goto(siteHref('/admin/'));
  }
</script>
{#if !ready}<div class="admin-loading"><div class="loading-block"></div><p>Opening the editor…</p></div>
{:else if !unlocked}<div class="login-page"><a class="back-link login-back" href={siteHref('/')}><IconArrowLeft size={17} /> Back to website</a><div class="login-panel"><a class="wordmark" href={siteHref('/')}>woodwork<span class="brand-period">.</span></a><div class="login-symbol"><IconLock size={23} stroke={1.5} /></div><h1>Your collection,<br />in your hands.</h1><p>Sign in to manage products and site content.</p><form onsubmit={login}><div class="form-field"><label for="username">Username</label><input id="username" autocomplete="username" bind:value={username} required /></div><div class="form-field"><label for="password">Password</label><input id="password" type="password" autocomplete="current-password" bind:value={password} required aria-describedby={error ? 'login-error' : undefined} /></div>{#if error}<p id="login-error" class="form-error" role="alert">{error}</p>{/if}<button type="submit" class="button primary">Sign in <IconArrowRight size={18} /></button></form><p class="login-note">Local editing only. Export and republish to update the website.</p></div></div>
{:else}<div class="admin-session-bar"><span>Local CMS <span class="session-bar-detail">Changes are saved in this browser.</span></span><div><a href={siteHref('/')} target="_blank" rel="noreferrer">View website</a><button onclick={logout}><IconLogout size={16} /> Log out</button></div></div>{@render children()}{/if}
