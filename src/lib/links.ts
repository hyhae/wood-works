export function storefrontHref(preview: boolean, path: string, params: Record<string, string> = {}) {
  if (!preview) return path + (Object.keys(params).length ? `?${new URLSearchParams(params)}` : '');
  const view = path === '/' ? 'home' : path.startsWith('/products/') && path !== '/products/' ? 'product' : path.replaceAll('/', '');
  const query = new URLSearchParams({ view, ...params });
  if (view === 'product') query.set('slug', path.split('/')[2]);
  return `/admin/preview/?${query}`;
}
