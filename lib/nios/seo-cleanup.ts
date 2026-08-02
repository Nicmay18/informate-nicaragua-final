import type { Noticia } from '@/lib/types';

export interface SeoIssue {
  id: string;
  slug: string;
  title: string;
  issue: 'titulo_largo' | 'meta_larga' | 'meta_vacia' | 'sin_autor' | 'sin_imagen' | 'sin_alt';
  value?: number | string;
}

export interface SeoCleanupReport {
  total: number;
  issues: SeoIssue[];
  counts: Record<string, number>;
}

export function runSeoCleanup(noticias: Noticia[]): SeoCleanupReport {
  const issues: SeoIssue[] = [];

  for (const n of noticias) {
    if (n.estado === 'borrador' || n.estado === 'archivado') continue;

    if (n.titulo && n.titulo.length > 60) {
      issues.push({
        id: `seo-title-${n.slug}`,
        slug: n.slug,
        title: n.titulo,
        issue: 'titulo_largo',
        value: n.titulo.length,
      });
    }

    const meta = n.metaDescription || '';
    if (!meta.trim()) {
      issues.push({
        id: `seo-meta-missing-${n.slug}`,
        slug: n.slug,
        title: n.titulo,
        issue: 'meta_vacia',
      });
    } else if (meta.length > 160) {
      issues.push({
        id: `seo-meta-long-${n.slug}`,
        slug: n.slug,
        title: n.titulo,
        issue: 'meta_larga',
        value: meta.length,
      });
    }

    if (!n.autor || !n.autor.trim()) {
      issues.push({
        id: `seo-author-${n.slug}`,
        slug: n.slug,
        title: n.titulo,
        issue: 'sin_autor',
      });
    }

    if (!n.imagen || n.imagen.includes('logo')) {
      issues.push({
        id: `seo-img-${n.slug}`,
        slug: n.slug,
        title: n.titulo,
        issue: 'sin_imagen',
      });
    } else if (!n.pieFoto || !n.pieFoto.trim()) {
      // pieFoto actúa como texto alternativo descriptivo
      issues.push({
        id: `seo-alt-${n.slug}`,
        slug: n.slug,
        title: n.titulo,
        issue: 'sin_alt',
      });
    }
  }

  const counts = issues.reduce((acc, issue) => {
    acc[issue.issue] = (acc[issue.issue] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return { total: issues.length, issues: issues.slice(0, 50), counts };
}
