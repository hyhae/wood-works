<script lang="ts">
  import { IconUpload, IconX } from '@tabler/icons-svelte';
  import { prepareImage } from './images';
  import { imageSrc } from '#lib/image-sizes.ts';
  let { src = $bindable(''), alt = $bindable(''), assets, label = 'Image', optional = false, onupload }: { src?: string; alt?: string; assets: Record<string, Blob>; label?: string; optional?: boolean; onupload: (src: string, blob: Blob) => void } = $props();
  const id = $props.id();
  let error = $state(''); let busy = $state(false); let url = $state('');
  $effect(() => {
    const blob = assets[src];
    url = blob ? URL.createObjectURL(blob) : imageSrc(src);
    return () => { if (blob && url.startsWith('blob:')) URL.revokeObjectURL(url); };
  });
  async function upload(event: Event) {
    const input = event.currentTarget as HTMLInputElement; const file = input.files?.[0]; if (!file) return;
    busy = true; error = '';
    try { const result = await prepareImage(file); onupload(result.src, result.blob); src = result.src; if (!alt) alt = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '); }
    catch (e) { error = e instanceof Error ? e.message : 'Could not process the image.'; }
    finally { busy = false; input.value = ''; }
  }
</script>
<div class="image-picker"><div class="image-picker-preview">{#if src}<img src={url || imageSrc(src)} alt={alt || 'Image preview'} width="160" height="160" />{:else}<span>No image</span>{/if}</div><div class="image-picker-controls"><label class="upload-button" for={`${id}-upload`}><IconUpload size={17} /> {busy ? 'Processing…' : `Upload ${label.toLowerCase()}`}</label><input id={`${id}-upload`} class="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onchange={upload} disabled={busy} /><p class="helper">JPEG, PNG, or WebP. Maximum 25 MB.</p><div class="form-field"><label for={`${id}-alt`}>{label} alternative text</label><input id={`${id}-alt`} bind:value={alt} required={!!src} /></div>{#if optional && src}<button type="button" class="text-link" onclick={() => { src = ''; alt = ''; }}><IconX size={14} /> Remove image</button>{/if}{#if error}<p class="form-error" role="alert">{error}</p>{/if}</div></div>
