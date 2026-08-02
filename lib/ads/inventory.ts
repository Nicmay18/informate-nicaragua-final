export interface AdSlot {
  id: string;
  name: string;
  type: 'banner' | 'sidebar' | 'newsletter' | 'sponsor' | 'native';
  size: string;
  placement: 'home' | 'article' | 'category' | 'newsletter';
  description: string;
  active: boolean;
  filled: boolean;
  priceUsd?: number;
}

export const AD_SLOTS: AdSlot[] = [
  { id: 'home-top', name: 'Home Superior 728x90', type: 'banner', size: '728x90', placement: 'home', description: 'Banner leaderboard sobre el hero de la portada.', active: true, filled: false, priceUsd: 75 },
  { id: 'home-sidebar', name: 'Home Sidebar 300x250', type: 'sidebar', size: '300x250', placement: 'home', description: 'Medium rectangle en el sidebar derecho.', active: true, filled: false, priceUsd: 45 },
  { id: 'article-inline', name: 'Artículo Cuerpo 300x250', type: 'banner', size: '300x250', placement: 'article', description: 'Banner dentro del cuerpo del artículo.', active: true, filled: false, priceUsd: 40 },
  { id: 'article-sidebar', name: 'Artículo Sidebar 300x600', type: 'sidebar', size: '300x600', placement: 'article', description: 'Half-page en el lateral de artículos.', active: true, filled: false, priceUsd: 90 },
  { id: 'newsletter-sponsor', name: 'Sponsor del boletín', type: 'newsletter', size: 'texto + logo', placement: 'newsletter', description: 'Mención premium en el newsletter diario.', active: true, filled: false, priceUsd: 120 },
  { id: 'category-sponsor', name: 'Patrocinio de categoría', type: 'sponsor', size: 'branding', placement: 'category', description: 'Marca patrocinadora en una categoría completa.', active: true, filled: false, priceUsd: 200 },
];

export function getAdInventory(): AdSlot[] {
  return AD_SLOTS;
}

export function getAvailableSlots(): AdSlot[] {
  return AD_SLOTS.filter((s) => s.active && !s.filled);
}
