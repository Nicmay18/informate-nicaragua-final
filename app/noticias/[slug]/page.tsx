import ArticleClient from '@/components/ArticleClient';
import { getNewsBySlug } from '@/lib/data';
import { notFound } from 'next/navigation';

// CONFIGURACIÓN NUCLEAR PARA EVITAR ERRORES DE BUILD
export const dynamic = 'force-dynamic'; 
export const fetchCache = 'force-no-store';
export const revalidate = 0;

// Esto le dice a Next.js: "No intentes fabricar estas páginas en el build"
export async function generateStaticParams() {
  return []; 
}

export default async function NewsPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  
  // Manejo de seguridad para evitar el error 'undefined'
  try {
    const noticia = await getNewsBySlug(slug);
    if (!noticia) return notFound();
    return <ArticleClient noticia={noticia} />;
  } catch (error) {
    console.error("Error cargando noticia:", error);
    return notFound();
  }
}