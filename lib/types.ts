export interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  date: string;
  image: string;
  readTime: number;
  slug: string;
  destacada: boolean;
  vistas: number;
}

export type Category = 'Todas' | 'Sucesos' | 'Nacionales' | 'Deportes' | 'Internacionales' | 'Espectáculos';

export const CATEGORY_COLORS: Record<string, string> = {
  Sucesos: '#dc2626',
  Nacionales: '#1e40af',
  Deportes: '#047857',
  Internacionales: '#7c3aed',
  Espectáculos: '#db2777',
  Espectaculo: '#db2777',
  Economía: '#0369a1',
  Tecnología: '#0891b2',
};

export const IMAGE_FALLBACKS: Record<string, string> = {
  Sucesos: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&q=80',
  Nacionales: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&q=80',
  Deportes: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80',
  Internacionales: 'https://images.unsplash.com/photo-1521295121783-8a321d551ad2?w=800&q=80',
  Espectáculos: 'https://images.unsplash.com/photo-1516280440614-6697288d5d38?w=800&q=80',
  Economía: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80',
};
