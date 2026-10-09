<script lang="ts">
  import '#lib/admin/admin.css';
  import AdminGate from '#lib/admin/AdminGate.svelte';
  let { children } = $props();
</script>
<svelte:head><meta name="robots" content="noindex, nofollow" /><title>Admin | Woodwork</title></svelte:head>
<AdminGate>{@render children()}</AdminGate>
