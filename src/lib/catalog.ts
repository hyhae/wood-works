import type { SiteContent, Product } from './types';

export const ordered = <T extends { order: number }>(items: T[]) => [...items].sort((a, b) => a.order - b.order);
export function visibleCategories(content: SiteContent) { return ordered(content.categories.filter(c => c.visible)); }
export function visibleSubcategories(content: SiteContent) {
  const parents = new Set(visibleCategories(content).map(c => c.id));
  return ordered(content.subcategories.filter(s => s.visible && parents.has(s.categoryId)));
}
export function catalogProducts(content: SiteContent) {
  const subIds = new Set(visibleSubcategories(content).map(s => s.id));
  return ordered(content.products.filter(p => p.visible && p.subcategoryIds.some(id => subIds.has(id))));
}
export function filterProducts(content: SiteContent, query: { category?: string; subcategory?: string; q?: string; sort?: string }) {
  const subcategories = visibleSubcategories(content);
  const category = visibleCategories(content).find(c => c.slug === query.category);
  const allowed = new Set(subcategories.filter(s => (!query.category || s.categoryId === category?.id) && (!query.subcategory || s.id === query.subcategory)).map(s => s.id));
  const term = (query.q || '').trim().toLowerCase();
  const products = catalogProducts(content).filter(p => p.subcategoryIds.some(id => allowed.has(id)) && `${p.name} ${p.description} ${p.materials} ${p.finishes}`.toLowerCase().includes(term));
  if (query.sort === 'name') products.sort((a, b) => a.name.localeCompare(b.name));
  if (query.sort === 'price-asc') products.sort((a, b) => a.price - b.price);
  if (query.sort === 'price-desc') products.sort((a, b) => b.price - a.price);
  return products;
}
export function priceLabel(price: number, currency: string) {
  return new Intl.NumberFormat('en-EG', { style: 'currency', currency, maximumFractionDigits: 2 }).format(price);
}
export function productGroup(content: SiteContent, product: Product) {
  return visibleSubcategories(content).find(s => product.subcategoryIds.includes(s.id))?.name || 'Furniture';
}
export function inquiryLinks(content: SiteContent, product?: Product, url = '') {
  const { whatsapp, email, phone } = content.settings;
  const subject = product ? `Inquiry about ${product.name}` : `Inquiry for ${content.settings.businessName}`;
  const message = product ? `Hello, I would like more information about ${product.name}.\n${url}` : 'Hello, I would like to know more about your furniture.';
  return {
    whatsapp: whatsapp ? `https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(message)}` : '',
    email: email ? `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}` : '',
    phone: phone ? `tel:${phone.replace(/[^+\d]/g, '')}` : ''
  };
}
export function assetPaths(content: SiteContent): string[] {
  const s = content.settings;
  return [...new Set([s.logo, s.heroImage, s.aboutImage, ...content.categories.map(c => c.image), ...content.products.flatMap(p => p.images.map(i => i.src))].filter(Boolean))];
}
export function categoryReferences(content: SiteContent, id: string) {
  const subIds = new Set(content.subcategories.filter(s => s.categoryId === id).map(s => s.id));
  return content.products.filter(p => p.subcategoryIds.some(s => subIds.has(s)));
}
