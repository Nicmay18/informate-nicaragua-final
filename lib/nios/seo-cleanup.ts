import type { Noticia } from '@/lib/types';
import { resolveEffectiveSeo } from '@/lib/seo/effective';

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

    const { description } = resolveEffectiveSeo(n);
    if (!description.trim()) {
      issues.push({
        id: `seo-meta-missing-${n.slug}`,
        slug: n.slug,
        title: n.titulo,
        issue: 'meta_vacia',
      });
    } else if (description.length > 160) {
      issues.push({
        id: `seo-meta-long-${n.slug}`,
        slug: n.slug,
        title: n.titulo,
        issue: 'meta_larga',
        value: description.length,
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
    }
  }

  const counts = issues.reduce((acc, issue) => {
    acc[issue.issue] = (acc[issue.issue] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return { total: issues.length, issues: issues.slice(0, 50), counts };
}
