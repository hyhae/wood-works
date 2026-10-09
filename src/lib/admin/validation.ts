import { z } from 'zod';
import type { SiteContent } from '../types.ts';

const text = z.string().max(20000);
const name = z.string().trim().min(1, 'This field is required.').max(160);
const id = z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/, 'Use a simple stable ID.');
const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers, and single hyphens.').max(160);
const asset = z.string().regex(/^\/media\/[a-zA-Z0-9_-]+\.(?:webp|png|jpe?g)$/, 'Images must be a local JPEG, PNG, or WebP in /media/.');
const optionalAsset = z.union([asset, z.literal('')]);
const order = z.number().int().min(0).max(100000);
const link = z.union([z.literal(''), z.url().refine(s => /^https?:\/\//.test(s), 'Use an http or https URL.')]);
const contactNumber = z.string().refine(s => !s || (/^\+?[\d ()-]+$/.test(s) && s.replace(/\D/g, '').length >= 7 && s.replace(/\D/g, '').length <= 15), 'Enter an international number with 7 to 15 digits.');

export const contentSchema = z.object({
  version: z.literal(1),
  settings: z.object({
    businessName: name, tagline: text, logo: optionalAsset, logoAlt: text,
    currency: z.string().refine(s => Intl.supportedValuesOf('currency').includes(s), 'Choose a supported three-letter currency code, such as EGP.'),
    heroTitle: name, heroText: text, heroImage: asset, heroImageAlt: name,
    homeIntroTitle: name, homeIntroText: text,
    aboutTitle: name, aboutText: text, aboutImage: asset, aboutImageAlt: name,
    footerText: text, email: z.union([z.literal(''), z.email()]), phone: contactNumber, whatsapp: contactNumber,
    address: text, hours: text, facebook: link, instagram: link, sampleNotice: z.boolean()
  }).strict().refine(s => !s.logo || s.logoAlt.trim(), { path: ['logoAlt'], message: 'Add alternative text for the logo.' }),
  categories: z.array(z.object({ id, name, slug, image: optionalAsset, imageAlt: text, visible: z.boolean(), order }).strict()).max(200),
  subcategories: z.array(z.object({ id, name, slug, categoryId: id, visible: z.boolean(), order }).strict()).max(1000),
  products: z.array(z.object({
    id, name, slug, price: z.number().positive('Enter a price greater than zero.').max(1e9), description: text,
    dimensions: text, materials: text, finishes: text, subcategoryIds: z.array(id).min(1, 'Assign at least one subcategory.'),
    images: z.array(z.object({ src: asset, alt: name }).strict()).min(1, 'Add at least one image.').max(30),
    visible: z.boolean(), featured: z.boolean(), order
  }).strict()).max(5000)
}).strict().superRefine((content, ctx) => {
  const issue = (message: string, path: (string | number)[]) => ctx.addIssue({ code: 'custom', message, path });
  for (const key of ['categories', 'subcategories', 'products'] as const) {
    const ids = new Set<string>(); const slugs = new Set<string>();
    content[key].forEach((item, i) => {
      if (ids.has(item.id)) issue(`Duplicate ID: ${item.id}`, [key, i, 'id']);
      ids.add(item.id);
      const scoped = key === 'subcategories' ? `${(item as { categoryId: string }).categoryId}/${item.slug}` : item.slug;
      if (slugs.has(scoped)) issue(`Duplicate URL slug: ${item.slug}`, [key, i, 'slug']);
      slugs.add(scoped);
    });
  }
  const categories = new Set(content.categories.map(c => c.id));
  const subcategories = new Set(content.subcategories.map(s => s.id));
  content.categories.forEach((c, i) => { if (c.image && !c.imageAlt.trim()) issue('Add alternative text for the category image.', ['categories', i, 'imageAlt']); });
  content.subcategories.forEach((s, i) => { if (!categories.has(s.categoryId)) issue('The parent category does not exist.', ['subcategories', i, 'categoryId']); });
  content.products.forEach((p, i) => {
    if (new Set(p.subcategoryIds).size !== p.subcategoryIds.length) issue('Remove duplicate category assignments.', ['products', i, 'subcategoryIds']);
    p.subcategoryIds.forEach((s, j) => { if (!subcategories.has(s)) issue('The subcategory does not exist.', ['products', i, 'subcategoryIds', j]); });
  });
});

export function validateContent(value: unknown): SiteContent { return contentSchema.parse(value); }
export function readableError(error: unknown) {
  if (error instanceof z.ZodError) return error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('\n');
  return error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.';
}
