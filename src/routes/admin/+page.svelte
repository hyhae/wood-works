<script lang="ts">
  import { onMount } from 'svelte';
  let Workspace = $state<typeof import('#lib/admin/Workspace.svelte').default | null>(null);
  let error = $state('');
  onMount(() => { import('#lib/admin/Workspace.svelte').then(module => Workspace = module.default).catch(() => error = 'Could not load the editor. Refresh this page to retry.'); });
</script>
{#if Workspace}<Workspace />{:else if error}<p class="form-error admin-loading" role="alert">{error}</p>{:else}<div class="admin-loading"><div class="loading-block"></div><p>Loading your collection…</p></div>{/if}
