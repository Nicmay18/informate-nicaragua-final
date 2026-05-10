import ArticleClient from '@/components/ArticleClient';
import { getNewsBySlug } from '@/lib/data';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;
// SOLUCION FINAL
export const revalidate = 0;

export async function generateStaticParams() {
  return [];
}

export default async function NewsPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  try {
    const noticia = await getNewsBySlug(slug);

    if (!noticia) {
      return notFound();
    }

    return <ArticleClient noticia={noticia} />;
  } catch (error) {
    console.error('Error cargando noticia:', error);
    return notFound();
  }
}
