import ArticleClient from '@/components/ArticleClient';
import { getNewsBySlug } from '@/lib/data';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;
// SOLUCION FINAL
export const revalidate = 0;

export default async function NewsPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const noticia = await getNewsBySlug(slug);

  if (!noticia) {
    notFound();
  }

  return <ArticleClient noticia={noticia} />;
}
