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

export const FALLBACK_IMAGE = '/logo.png';
