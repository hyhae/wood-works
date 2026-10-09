import { resolve } from '$app/paths';
import type { PathnameWithSearchOrHash } from '$app/types';

export function siteHref(path: string) {
  return resolve(path as PathnameWithSearchOrHash);
}

export function storefrontHref(preview: boolean, path: string, params: Record<string, string> = {}) {
  if (!preview) return siteHref(path) + (Object.keys(params).length ? `?${new URLSearchParams(params)}` : '');
  const view = path === '/' ? 'home' : path.startsWith('/products/') && path !== '/products/' ? 'product' : path.replaceAll('/', '');
  const query = new URLSearchParams({ view, ...params });
  if (view === 'product') query.set('slug', path.split('/')[2]);
  return `${siteHref('/admin/preview/')}?${query}`;
}
