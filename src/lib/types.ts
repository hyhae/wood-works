export interface ImageAsset { src: string; alt: string }
export interface Category {
  id: string; name: string; slug: string; image: string; imageAlt: string; visible: boolean; order: number;
}
export interface Subcategory {
  id: string; name: string; slug: string; categoryId: string; visible: boolean; order: number;
}
export interface Product {
  id: string; name: string; slug: string; price: number; description: string;
  dimensions: string; materials: string; finishes: string; subcategoryIds: string[];
  images: ImageAsset[]; visible: boolean; featured: boolean; order: number;
}
export interface SiteSettings {
  businessName: string; tagline: string; logo: string; logoAlt: string; currency: string;
  heroTitle: string; heroText: string; heroImage: string; heroImageAlt: string;
  homeIntroTitle: string; homeIntroText: string;
  aboutTitle: string; aboutText: string; aboutImage: string; aboutImageAlt: string;
  footerText: string; email: string; phone: string; whatsapp: string;
  address: string; hours: string; facebook: string; instagram: string; sampleNotice: boolean;
}
export interface SiteContent {
  version: 1; settings: SiteSettings; categories: Category[]; subcategories: Subcategory[]; products: Product[];
}
export interface Draft { content: SiteContent; assets: Record<string, Blob> }
