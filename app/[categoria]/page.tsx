import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import HomePagePro from '@/components/HomePagePro';
import { getNewsByCategory, getMasLeidas } from '@/lib/data';
import { slugToCategory } from '@/lib/types';
import type { Noticia } from '@/lib/types';

export async function generateStaticParams() {
  return [
    { categoria: 'sucesos' },
    { categoria: 'nacionales' },
    { categoria: 'deportes' },
    { categoria: 'internacionales' },
    { categoria: 'tecnologia' },
    { categoria: 'espectaculos' },
  ];
}

export async function generateMetadata({ params }: { params: Promise<{ categoria: string }> }): Promise<Metadata> {
  const { categoria } = await params;
  const catName = slugToCategory(categoria);
  if (!catName) return {};
  const canonicalUrl = `https://nicaraguainformate.com/categoria/${categoria}`;
  return {
    title: `${catName} - Noticias de Nicaragua`,
    description: `Noticias de ${catName} en Nicaragua.`,
    alternates: { canonical: canonicalUrl },
    robots: { index: false, follow: true },
  };
}

export const revalidate = 60;

export default async function CategoryPage({ params }: { params: Promise<{ categoria: string }> }) {
  const { categoria } = await params;
  const catName = slugToCategory(categoria);
  if (!catName) return notFound();

  let noticias: Noticia[] = [];
  let masLeidas: Noticia[] = [];
  try {
    [noticias, masLeidas] = await Promise.all([
      getNewsByCategory(catName, 100),
      getMasLeidas(),
    ]);
  } catch (error) {
    console.error('[CategoryPage] Error:', error);
  }

  return <HomePagePro noticias={noticias} masLeidas={masLeidas} />;
}
