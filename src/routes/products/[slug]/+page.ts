import { error } from '@sveltejs/kit';
import { published } from '#lib/published.ts';
import { catalogProducts } from '#lib/catalog.ts';
export function entries() { return catalogProducts(published).map(p => ({ slug: p.slug })); }
export function load({ params }: { params: { slug: string } }) {
  const product = catalogProducts(published).find(p => p.slug === params.slug);
  if (!product) error(404, 'This piece could not be found.');
  return { product };
}
