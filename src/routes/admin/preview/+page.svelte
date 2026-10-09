<script lang="ts">
  import { onMount } from 'svelte';
  let Preview = $state<typeof import('#lib/admin/DraftPreview.svelte').default | null>(null);
  let error = $state('');
  onMount(() => { import('#lib/admin/DraftPreview.svelte').then(module => Preview = module.default).catch(() => error = 'Could not load the preview. Refresh to retry.'); });
</script>
{#if Preview}<Preview />{:else if error}<p class="form-error admin-loading" role="alert">{error}</p>{:else}<div class="admin-loading"><div class="loading-block"></div><p>Loading your preview…</p></div>{/if}
