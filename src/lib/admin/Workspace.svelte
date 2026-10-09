<script lang="ts">
  import { siteHref } from '#lib/links.ts';
  import { onMount } from 'svelte';
  import { beforeNavigate } from '$app/navigation';
  import { IconPackage, IconCategory, IconSettings, IconFileExport, IconPlus, IconArrowLeft, IconArrowUp, IconArrowDown, IconTrash, IconEye, IconDownload, IconUpload, IconCheck, IconArrowUpRight, IconSearch } from '@tabler/icons-svelte';
  import { published } from '#lib/published.ts';
  import type { SiteContent, SiteSettings, Product, Draft } from '#lib/types.ts';
  import { ordered, categoryReferences, assetPaths, priceLabel } from '#lib/catalog.ts';
  import { validateContent, readableError } from './validation';
  import { loadDraft, saveDraft } from './storage';
  import { prepareImage } from './images';
  import ImagePicker from './ImagePicker.svelte';
  import { imageSrc } from '#lib/image-sizes.ts';

  type Section = 'products' | 'categories' | 'content' | 'export';
  let section = $state<Section>('products');
  let content = $state<SiteContent>(JSON.parse(JSON.stringify(published)));
  let assets = $state<Record<string, Blob>>({});
  let loading = $state(true); let busy = $state(false); let error = $state(''); let status = $state('');
  let savedSignature = $state('');
  let productEditor = $state<Product | null>(null); let editorSignature = $state('');
  let productSearch = $state(''); let draftUrls = $state<Record<string, string>>({});
  let dirty = $derived(savedSignature !== JSON.stringify(content) || (!!productEditor && editorSignature !== JSON.stringify(productEditor)));
  let products = $derived(ordered(content.products).filter(p => `${p.name} ${p.slug}`.toLowerCase().includes(productSearch.toLowerCase())));
  const menu = [ { id: 'products', name: 'Products', icon: IconPackage }, { id: 'categories', name: 'Categories', icon: IconCategory }, { id: 'content', name: 'Site Content', icon: IconSettings }, { id: 'export', name: 'Import / Export', icon: IconFileExport } ] as const;
  const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));
  const newId = () => crypto.randomUUID();
  const slugify = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const snapshot = (): Draft => ({ content: clone(content), assets: Object.fromEntries(Object.entries(assets)) });
  beforeNavigate(navigation => { if (!loading && dirty && !confirm('Leave without saving your changes?')) navigation.cancel(); });

  onMount(() => {
    loadDraft().then(draft => { if (draft) { content = draft.content; assets = draft.assets; status = 'Saved draft restored.'; } savedSignature = JSON.stringify(content); }).catch(e => { error = readableError(e); savedSignature = JSON.stringify(content); }).finally(() => loading = false);
    const beforeUnload = (e: BeforeUnloadEvent) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', beforeUnload);
    const beforeLogout = (e: Event) => { if (dirty && !confirm('Log out without saving your changes?')) e.preventDefault(); };
    window.addEventListener('woodwork-before-logout', beforeLogout);
    return () => { window.removeEventListener('beforeunload', beforeUnload); window.removeEventListener('woodwork-before-logout', beforeLogout); };
  });
  $effect(() => {
    const urls: Record<string, string> = {};
    for (const [path, blob] of Object.entries(assets)) urls[path] = URL.createObjectURL(blob);
    draftUrls = urls;
    return () => Object.values(urls).forEach(url => URL.revokeObjectURL(url));
  });
  function switchSection(next: Section) {
    if (productEditor && editorSignature !== JSON.stringify(productEditor) && !confirm('Discard unsaved changes to this product?')) return;
    productEditor = null; section = next; error = ''; status = '';
  }
  async function commit(next: SiteContent = content) {
    busy = true; error = ''; status = 'Saving draft…';
    try {
      const validated = validateContent(clone(next));
      await saveDraft({ content: validated, assets: Object.fromEntries(Object.entries(assets)) });
      content = validated; savedSignature = JSON.stringify(content); status = 'Saved locally. Export to publish your changes.'; return true;
    } catch (e) { error = readableError(e); status = 'Draft not saved.'; return false; }
    finally { busy = false; }
  }
  function editProduct(product?: Product) {
    if (productEditor && editorSignature !== JSON.stringify(productEditor) && !confirm('Discard unsaved changes to this product?')) return;
    productEditor = product ? clone(product) : { id: newId(), name: '', slug: '', price: 0, description: '', dimensions: '', materials: '', finishes: '', subcategoryIds: [], images: [], visible: true, featured: false, order: content.products.length ? Math.max(...content.products.map(p => p.order)) + 1 : 0 };
    editorSignature = JSON.stringify(productEditor); error = ''; status = '';
  }
  function closeEditor() { if (productEditor && editorSignature !== JSON.stringify(productEditor) && !confirm('Discard unsaved changes to this product?')) return; productEditor = null; error = ''; }
  async function saveProduct(event: SubmitEvent) {
    event.preventDefault(); if (!productEditor) return;
    const product = clone(productEditor); const next = clone(content); const index = next.products.findIndex(p => p.id === product.id);
    if (index >= 0) next.products[index] = product; else next.products.push(product);
    if (await commit(next)) { productEditor = product; editorSignature = JSON.stringify(product); }
  }
  async function deleteProduct(product: Product) {
    if (!confirm(`Delete ${product.name}? This change remains local until you export and republish.`)) return;
    const next = clone(content); next.products = next.products.filter(p => p.id !== product.id); await commit(next);
  }
  function reorder<T extends { id: string; order: number }>(items: T[], id: string, delta: number): T[] {
    const list = ordered(items); const i = list.findIndex(item => item.id === id); const j = i + delta;
    if (j < 0 || j >= list.length) return items;
    [list[i], list[j]] = [list[j], list[i]]; return list.map((item, index) => ({ ...item, order: index }));
  }
  async function moveProduct(id: string, delta: number) { const next = clone(content); next.products = reorder(next.products, id, delta); await commit(next); }
  function assignSubcategory(id: string, checked: boolean) { if (!productEditor) return; productEditor.subcategoryIds = checked ? [...productEditor.subcategoryIds, id] : productEditor.subcategoryIds.filter(s => s !== id); }
  function uploaded(src: string, blob: Blob) { assets[src] = blob; }
  async function uploadProductImages(event: Event) {
    const input = event.currentTarget as HTMLInputElement; const files = [...(input.files || [])]; if (!files.length || !productEditor) return;
    busy = true; error = '';
    try {
      if (productEditor.images.length + files.length > 30) throw new Error('A product can have up to 30 images.');
      for (const file of files) { const result = await prepareImage(file); uploaded(result.src, result.blob); productEditor.images.push({ src: result.src, alt: productEditor.name || file.name.replace(/\.[^.]+$/, '') }); }
    } catch (e) { error = readableError(e); }
    finally { busy = false; input.value = ''; }
  }
  function moveImage(index: number, delta: number) { if (!productEditor) return; const j = index + delta; if (j < 0 || j >= productEditor.images.length) return; const list = [...productEditor.images]; [list[index], list[j]] = [list[j], list[index]]; productEditor.images = list; }
  function addCategory() { content.categories.push({ id: newId(), name: 'New category', slug: `category-${content.categories.length + 1}`, image: '', imageAlt: '', visible: true, order: content.categories.length }); }
  function deleteCategory(id: string) {
    const references = categoryReferences(content, id);
    if (references.length) { error = `Reassign ${references.length} product(s) in Products before deleting this category: ${references.map(p => p.name).join(', ')}.`; return; }
    if (!confirm('Delete this category and its subcategories?')) return;
    content.categories = content.categories.filter(c => c.id !== id); content.subcategories = content.subcategories.filter(s => s.categoryId !== id); error = '';
  }
  function addSubcategory(categoryId: string) { content.subcategories.push({ id: newId(), name: 'New subcategory', slug: `type-${content.subcategories.length + 1}`, categoryId, visible: true, order: content.subcategories.filter(s => s.categoryId === categoryId).length }); }
  function deleteSubcategory(id: string) {
    const references = content.products.filter(p => p.subcategoryIds.includes(id));
    if (references.length) { error = `Reassign these products before deleting the subcategory: ${references.map(p => p.name).join(', ')}.`; return; }
    if (confirm('Delete this subcategory?')) { content.subcategories = content.subcategories.filter(s => s.id !== id); error = ''; }
  }
  function moveSubcategory(id: string, delta: number) {
    const sub = content.subcategories.find(s => s.id === id)!;
    const list = reorder(content.subcategories.filter(s => s.categoryId === sub.categoryId), id, delta);
    content.subcategories = [...content.subcategories.filter(s => s.categoryId !== sub.categoryId), ...list];
  }
  async function exportDraft() {
    if (productEditor && editorSignature !== JSON.stringify(productEditor)) { error = 'Save the product before exporting.'; return; }
    if (dirty && !await commit()) return;
    busy = true; error = ''; status = 'Preparing your export…';
    try {
      const { exportBundle } = await import('./archive');
      const bytes = await exportBundle(snapshot(), async path => { const response = await fetch(imageSrc(path)); if (!response.ok) throw new Error(`Could not read ${path}. Keep the website available while exporting.`); return response.blob(); });
      const url = URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type: 'application/zip' }));
      const anchor = document.createElement('a'); anchor.href = url; anchor.download = `woodwork-content-${new Date().toISOString().slice(0, 10)}.zip`; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 10000);
      status = 'Export ready. Extract it into the project, rebuild, and redeploy.';
    } catch (e) { error = readableError(e); status = 'Export failed.'; }
    finally { busy = false; }
  }
  async function importDraft(event: Event) {
    const input = event.currentTarget as HTMLInputElement; const file = input.files?.[0]; if (!file) return;
    if (!confirm('Replace this browser’s draft with the imported content? Export your current draft first if you need a backup.')) { input.value = ''; return; }
    busy = true; error = ''; status = 'Checking the import…';
    try {
      if (file.size > 100 * 1024 * 1024) throw new Error('Choose a ZIP smaller than 100 MB.');
      const { importBundle } = await import('./archive');
      const draft = await importBundle(new Uint8Array(await file.arrayBuffer()));
      await saveDraft(draft); content = draft.content; assets = draft.assets; savedSignature = JSON.stringify(content); productEditor = null; status = 'Import saved locally. Your public website has not changed.';
    } catch (e) { error = readableError(e); status = 'Import rejected. Your existing draft is unchanged.'; }
    finally { busy = false; input.value = ''; }
  }
  async function resetDraft() {
    if (!confirm('Replace this local draft with the currently built website? Export a backup first to keep your edits.')) return;
    busy = true; error = '';
    try { const draft = { content: clone(published), assets: {} }; await saveDraft(draft); content = draft.content; assets = {}; savedSignature = JSON.stringify(content); status = 'Draft reset to the built website.'; }
    catch (e) { error = readableError(e); } finally { busy = false; }
  }
  type TextSetting = Exclude<keyof SiteSettings, 'sampleNotice'>;
  type SettingField = { key: TextSetting; label: string; type?: string; large?: boolean; required?: boolean; help?: string };
  const groups: { title: string; fields: SettingField[] }[] = [
    { title: 'Brand & catalog', fields: [{ key: 'businessName', label: 'Business name', required: true }, { key: 'tagline', label: 'Tagline' }, { key: 'currency', label: 'Currency', required: true, help: 'ISO currency code, such as EGP. Changing it does not convert prices.' }, { key: 'footerText', label: 'Footer introduction', large: true }] },
    { title: 'Homepage', fields: [{ key: 'heroTitle', label: 'Hero title', required: true }, { key: 'heroText', label: 'Hero description', large: true }, { key: 'homeIntroTitle', label: 'Introduction title', required: true }, { key: 'homeIntroText', label: 'Introduction text', large: true }] },
    { title: 'About us', fields: [{ key: 'aboutTitle', label: 'About page title', required: true }, { key: 'aboutText', label: 'Your story', large: true, help: 'Use blank lines to separate paragraphs.' }] },
    { title: 'Contact & social links', fields: [{ key: 'email', label: 'Email address', type: 'email' }, { key: 'phone', label: 'Phone number', type: 'tel' }, { key: 'whatsapp', label: 'WhatsApp number', type: 'tel', help: 'Include the country code, for example +20. Leave blank to hide the link.' }, { key: 'address', label: 'Address', large: true }, { key: 'hours', label: 'Opening hours', large: true }, { key: 'facebook', label: 'Facebook URL', type: 'url' }, { key: 'instagram', label: 'Instagram URL', type: 'url' }] }
  ];
</script>

<div class="admin-layout"><aside class="admin-sidebar"><a href={siteHref('/admin/')} class="wordmark">woodwork<span class="brand-period">.</span></a><p class="sidebar-caption">Collection manager</p><nav aria-label="Admin sections">{#each menu as item}<button class:active={section === item.id} onclick={() => switchSection(item.id)}><item.icon size={19} stroke={1.5} />{item.name}</button>{/each}</nav><div class="sidebar-note"><p>Draft → export → publish</p><span>Your public catalog changes only after a new build is deployed.</span><a href={siteHref('/admin/preview/')} class="text-link">Preview draft <IconArrowUpRight size={16} /></a></div></aside>
<div class="admin-workspace">
  {#if loading}<div class="admin-loading"><div class="loading-block"></div><p>Reading your local draft…</p></div>{:else}
  <div class="admin-page-header"><div><p class="admin-breadcrumb">Collection manager / {menu.find(m => m.id === section)?.name}</p><h1>{productEditor ? (productEditor.name || 'New product') : menu.find(m => m.id === section)?.name}</h1><p class="admin-description">{section === 'products' ? 'Keep every piece and its details in one place.' : section === 'categories' ? 'Organize the collection around how people live.' : section === 'content' ? 'Make the website feel like your brand.' : 'Take your draft from this browser to your website.'}</p></div><span class="draft-state" class:unsaved={dirty}><IconCheck size={15} /> {dirty ? 'Unsaved changes' : 'Local draft'}</span></div>
  {#if error}<div class="admin-alert error" role="alert"><strong>Please check the following</strong><p class="preserve-lines">{error}</p></div>{/if}
  {#if status}<p class="save-status" role="status">{status}</p>{/if}

  {#if section === 'products'}
    {#if productEditor}
    <button class="back-link" onclick={closeEditor}><IconArrowLeft size={16} /> All products</button>
    <form class="admin-form" onsubmit={saveProduct}><fieldset disabled={busy}>
      <div class="admin-panel"><h2>Product details</h2><div class="form-grid"><div class="form-field"><label for="product-name">Product name</label><input id="product-name" bind:value={productEditor.name} required onblur={() => { if (productEditor && !productEditor.slug) productEditor.slug = slugify(productEditor.name); }} /></div><div class="form-field"><label for="product-slug">URL slug</label><input id="product-slug" bind:value={productEditor.slug} required pattern="[a-z0-9]+(-[a-z0-9]+)*" /><p class="helper">Keep this stable to preserve existing product links.</p></div><div class="form-field"><label for="product-price">Price ({content.settings.currency})</label><input id="product-price" type="number" min="0.01" max="1000000000" step="0.01" bind:value={productEditor.price} required /></div><div class="form-field"><label for="product-order">Display order</label><input id="product-order" type="number" min="0" step="1" bind:value={productEditor.order} required /></div><div class="form-field full-width"><label for="product-description">Description</label><textarea id="product-description" bind:value={productEditor.description} rows="4"></textarea></div>{#each ['dimensions', 'materials', 'finishes'] as field}<div class="form-field"><label for={`product-${field}`}>{field[0].toUpperCase() + field.slice(1)}</label><input id={`product-${field}`} bind:value={productEditor[field as 'dimensions' | 'materials' | 'finishes']} /></div>{/each}</div><div class="checkbox-row"><label><input type="checkbox" bind:checked={productEditor.visible} /> Visible in catalog</label><label><input type="checkbox" bind:checked={productEditor.featured} /> Featured on homepage</label></div></div>
      <div class="admin-panel"><h2>Category assignments</h2><p class="helper">Choose one or more types. A dining chair can belong to both Dining and Chairs.</p><div class="assignment-grid">{#each ordered(content.categories) as category}<div><h3>{category.name}{!category.visible ? ' (hidden)' : ''}</h3>{#each ordered(content.subcategories.filter(s => s.categoryId === category.id)) as sub}<label class="checkbox-label"><input type="checkbox" checked={productEditor.subcategoryIds.includes(sub.id)} onchange={e => assignSubcategory(sub.id, e.currentTarget.checked)} /> {sub.name}{!sub.visible ? ' (hidden)' : ''}</label>{/each}</div>{/each}</div></div>
      <div class="admin-panel"><h2>Product images</h2><p class="helper">The first image is the main catalog photo. Add descriptive alternative text to every image.</p>{#each productEditor.images as image, index (image.src)}<div class="gallery-editor-item"><ImagePicker bind:src={image.src} bind:alt={image.alt} {assets} label={`Image ${index + 1}`} onupload={uploaded} /><div class="row-actions"><button type="button" class="icon-button" aria-label={`Move image ${index + 1} up`} disabled={index === 0} onclick={() => moveImage(index, -1)}><IconArrowUp size={17} /></button><button type="button" class="icon-button" aria-label={`Move image ${index + 1} down`} disabled={index === productEditor!.images.length - 1} onclick={() => moveImage(index, 1)}><IconArrowDown size={17} /></button><button type="button" class="icon-button danger" aria-label={`Remove image ${index + 1}`} onclick={() => { if (productEditor) productEditor.images = productEditor.images.filter((_, i) => i !== index); }}><IconTrash size={17} /></button></div></div>{/each}<label class="upload-button" for="gallery-upload"><IconPlus size={17} /> Add images</label><input class="sr-only" id="gallery-upload" type="file" accept="image/jpeg,image/png,image/webp" multiple onchange={uploadProductImages} /></div>
      <div class="form-actions"><button class="button primary" type="submit">{busy ? 'Saving…' : 'Save product'}</button><button class="button secondary" type="button" onclick={closeEditor}>Back to products</button><a class="text-link" href={siteHref(`/admin/preview/?view=product&slug=${productEditor.slug}`)}><IconEye size={17} /> Preview saved product</a></div>
    </fieldset></form>
    {:else}
    <div class="admin-toolbar"><div class="admin-search"><IconSearch size={18} /><label class="sr-only" for="admin-product-search">Search products</label><input id="admin-product-search" placeholder="Search products" bind:value={productSearch} /></div><button class="button primary" onclick={() => editProduct()} disabled={busy}><IconPlus size={17} /> New product</button></div>
    <div class="product-list-header"><span>{content.products.length} products</span><span>Price / Visibility / Actions</span></div>
    <div class="admin-product-list">{#each products as product}<div class="admin-product-row"><img src={imageSrc(product.images[0].src, draftUrls)} alt={product.images[0].alt} width="72" height="72" /><button class="product-edit-link" onclick={() => editProduct(product)}><strong>{product.name}</strong><span>/products/{product.slug}/</span></button><span class="admin-price">{priceLabel(product.price, content.settings.currency)}</span><span class="visibility-label">{product.visible ? 'Visible' : 'Hidden'}</span><div class="row-actions"><button class="icon-button" aria-label={`Move ${product.name} up`} disabled={busy || ordered(content.products)[0]?.id === product.id} onclick={() => moveProduct(product.id, -1)}><IconArrowUp size={16} /></button><button class="icon-button" aria-label={`Move ${product.name} down`} disabled={busy || ordered(content.products).at(-1)?.id === product.id} onclick={() => moveProduct(product.id, 1)}><IconArrowDown size={16} /></button><button class="icon-button danger" aria-label={`Delete ${product.name}`} disabled={busy} onclick={() => deleteProduct(product)}><IconTrash size={16} /></button></div></div>{:else}<div class="empty-state"><h2>No products found.</h2><p>Add a new piece or change your search.</p></div>{/each}</div>
    {/if}
  {:else if section === 'categories'}
    <form class="admin-form" onsubmit={e => { e.preventDefault(); commit(); }}><fieldset disabled={busy}><div class="admin-toolbar"><p class="helper">Save your changes when you’re finished.</p><button class="button secondary" type="button" onclick={addCategory}><IconPlus size={17} /> Add category</button></div>
    {#each ordered(content.categories) as category (category.id)}<div class="admin-panel category-editor"><div class="panel-heading"><h2>{category.name}</h2><div class="row-actions"><button type="button" class="icon-button" aria-label={`Move ${category.name} category up`} disabled={ordered(content.categories)[0]?.id === category.id} onclick={() => content.categories = reorder(content.categories, category.id, -1)}><IconArrowUp size={16} /></button><button type="button" class="icon-button" aria-label={`Move ${category.name} category down`} disabled={ordered(content.categories).at(-1)?.id === category.id} onclick={() => content.categories = reorder(content.categories, category.id, 1)}><IconArrowDown size={16} /></button><button type="button" class="icon-button danger" aria-label={`Delete ${category.name} category`} onclick={() => deleteCategory(category.id)}><IconTrash size={17} /></button></div></div><div class="form-grid"><div class="form-field"><label for={`cat-${category.id}-name`}>Category name</label><input id={`cat-${category.id}-name`} bind:value={category.name} required /></div><div class="form-field"><label for={`cat-${category.id}-slug`}>Category slug</label><input id={`cat-${category.id}-slug`} bind:value={category.slug} required /></div><div class="form-field"><label for={`cat-${category.id}-order`}>Display order</label><input id={`cat-${category.id}-order`} type="number" min="0" step="1" bind:value={category.order} required /></div><label class="checkbox-label"><input type="checkbox" bind:checked={category.visible} /> Visible category</label></div><details class="category-image-details"><summary>Category image</summary><ImagePicker bind:src={category.image} bind:alt={category.imageAlt} {assets} label={`${category.name} image`} optional onupload={uploaded} /></details><h3 class="subheading">Subcategories</h3>{#each ordered(content.subcategories.filter(s => s.categoryId === category.id)) as sub (sub.id)}<div class="subcategory-editor"><div class="form-field"><label for={`sub-${sub.id}-name`}>Name</label><input id={`sub-${sub.id}-name`} bind:value={sub.name} required /></div><div class="form-field"><label for={`sub-${sub.id}-slug`}>Slug</label><input id={`sub-${sub.id}-slug`} bind:value={sub.slug} required /></div><div class="form-field"><label for={`sub-${sub.id}-parent`}>Parent</label><select id={`sub-${sub.id}-parent`} bind:value={sub.categoryId}>{#each content.categories as parent}<option value={parent.id}>{parent.name}</option>{/each}</select></div><label class="checkbox-label"><input type="checkbox" bind:checked={sub.visible} /> Visible</label><div class="row-actions"><button type="button" class="icon-button" aria-label={`Move ${sub.name} in ${category.name} up`} onclick={() => moveSubcategory(sub.id, -1)}><IconArrowUp size={15} /></button><button type="button" class="icon-button" aria-label={`Move ${sub.name} in ${category.name} down`} onclick={() => moveSubcategory(sub.id, 1)}><IconArrowDown size={15} /></button><button type="button" class="icon-button danger" aria-label={`Delete ${sub.name} in ${category.name}`} onclick={() => deleteSubcategory(sub.id)}><IconTrash size={15} /></button></div></div>{/each}<button type="button" class="text-link" onclick={() => addSubcategory(category.id)}><IconPlus size={16} /> Add subcategory</button></div>{/each}<div class="form-actions"><button class="button primary" type="submit">{busy ? 'Saving…' : 'Save categories'}</button></div></fieldset></form>
  {:else if section === 'content'}
    <form class="admin-form" onsubmit={e => { e.preventDefault(); commit(); }}><fieldset disabled={busy}>
      {#each groups as group}<div class="admin-panel"><h2>{group.title}</h2><div class="form-grid">{#each group.fields as field}<div class="form-field" class:full-width={field.large}><label for={`setting-${field.key}`}>{field.label}</label>{#if field.large}<textarea id={`setting-${field.key}`} bind:value={content.settings[field.key]} rows={field.key === 'aboutText' ? 8 : 3} required={field.required}></textarea>{:else}<input id={`setting-${field.key}`} type={field.type || 'text'} bind:value={content.settings[field.key]} required={field.required} />{/if}{#if field.help}<p class="helper">{field.help}</p>{/if}</div>{/each}</div>{#if group.title === 'Brand & catalog'}<div class="settings-image"><ImagePicker bind:src={content.settings.logo} bind:alt={content.settings.logoAlt} {assets} label="Logo" optional onupload={uploaded} /></div><label class="checkbox-label"><input type="checkbox" bind:checked={content.settings.sampleNotice} /> Display the sample collection notice</label>{:else if group.title === 'Homepage'}<div class="settings-image"><ImagePicker bind:src={content.settings.heroImage} bind:alt={content.settings.heroImageAlt} {assets} label="Hero image" onupload={uploaded} /></div>{:else if group.title === 'About us'}<div class="settings-image"><ImagePicker bind:src={content.settings.aboutImage} bind:alt={content.settings.aboutImageAlt} {assets} label="About image" onupload={uploaded} /></div>{/if}</div>{/each}<div class="form-actions"><button class="button primary" type="submit">{busy ? 'Saving…' : 'Save site content'}</button></div>
    </fieldset></form>
  {:else}
    <div class="export-overview"><div><span>{content.products.length}</span><p>Products</p></div><div><span>{content.categories.length}</span><p>Categories</p></div><div><span>{assetPaths(content).length}</span><p>Images</p></div></div>
    <div class="admin-panel"><h2>Preview your draft</h2><p>See the saved draft using the same layouts as the storefront. Save any changes before opening the preview.</p><div class="form-actions"><button class="button secondary" disabled={busy} onclick={() => commit()}>Save draft</button><a class="button primary" href={siteHref('/admin/preview/')}><IconEye size={18} /> Preview draft</a></div></div>
    <div class="admin-panel"><h2>Export to publish</h2><p>Download your content and images in a single ZIP. The public website stays unchanged until you rebuild and deploy.</p><ol class="publishing-steps"><li>Export your draft using the button below.</li><li>Extract the ZIP into the SvelteKit project root, replacing the included content file and image files.</li><li>Run <code>npm run check</code> and <code>npm run build</code>.</li><li>Deploy the contents of <code>build/</code> to your static host.</li></ol><button class="button primary" disabled={busy} onclick={exportDraft}><IconDownload size={18} /> {busy ? 'Working…' : 'Export content ZIP'}</button></div>
    <div class="admin-panel"><h2>Import a backup</h2><p>Restore an exported ZIP to this browser. All content and images are validated before your existing draft is replaced.</p><label class="upload-button" for="content-import"><IconUpload size={18} /> Import content ZIP</label><input id="content-import" class="sr-only" type="file" accept=".zip,application/zip" disabled={busy} onchange={importDraft} /><p class="helper">Maximum 100 MB, including uncompressed files.</p></div>
    <div class="admin-panel reset-panel"><h2>Start from the built website</h2><p>Replace your local draft with the content currently shipped in this website. Export a backup first to keep your edits.</p><button class="button secondary" disabled={busy} onclick={resetDraft}>Reset local draft</button></div>
  {/if}
  {/if}
</div></div>
