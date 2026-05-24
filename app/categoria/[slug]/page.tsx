import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import MobileHome from '@/components/MobileHome';
import { getNewsByCategory, getMasLeidas } from '@/lib/data';
import { slugToCategory, CATEGORIES } from '@/lib/types';
import type { Noticia } from '@/lib/types';

const SITE_URL = 'https://nicaraguainformate.com';

/** Metadata atractiva por categoría para mejorar CTR */
const CATEGORIA_META: Record<string, { titulo: string; description: string }> = {
  sucesos: {
    titulo: 'Sucesos en Nicaragua | Policíales y Accidentes Hoy',
    description: 'Reportes de sucesos en Nicaragua: accidentes de tránsito, hechos policiales y emergencias en tiempo real.',
  },
  nacionales: {
    titulo: 'Noticias Nacionales de Nicaragua | Actualidad y Sociedad',
    description: 'Entérate de lo último en Nicaragua: noticias nacionales, economía, infraestructura y desarrollo social. Cobertura actualizada desde Managua.',
  },
  internacionales: {
    titulo: 'Noticias Internacionales | Centroamérica y el Mundo',
    description: 'Lo que pasa fuera de Nicaragua: noticias de Centroamérica, Estados Unidos, Europa y el resto del mundo.',
  },
  tecnologia: {
    titulo: 'Tecnología en Nicaragua | Innovación y Digital',
    description: 'Avances tecnológicos en Nicaragua: internet, telecomunicaciones, startups y transformación digital.',
  },
  economia: {
    titulo: 'Economía de Nicaragua | Finanzas, Dólar y Mercado',
    description: 'Noticias económicas de Nicaragua: tipo de cambio dólar córdoba, inflación, precios y mercado financiero.',
  },
  deportes: {
    titulo: 'Deportes en Nicaragua | Fútbol, Béisbol y Atletismo',
    description: 'Resultados, fichajes y noticias del deporte nicaragüense. Liga Primera, selección nacional y eventos deportivos.',
  },
};

export async function generateStaticParams() {
  return CATEGORIES.map((cat) => ({
    slug: cat.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, ''),
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const slugLower = slug.toLowerCase();
  const catName = slugToCategory(slugLower);
  if (!catName) return { title: 'Categoría no encontrada' };

  const meta = CATEGORIA_META[slugLower] || {
    titulo: `${catName} | Noticias de Nicaragua`,
    description: `Últimas noticias de ${catName} en Nicaragua Informate.`,
  };

  const canonicalUrl = `${SITE_URL}/categoria/${slugLower}`;

  return {
    title: meta.titulo,
    description: meta.description,
    alternates: { canonical: canonicalUrl },
    robots: { index: true, follow: true },
    openGraph: {
      type: 'website',
      locale: 'es_NI',
      url: canonicalUrl,
      siteName: 'Nicaragua Informate',
      title: meta.titulo,
      description: meta.description,
      images: [{ url: `${SITE_URL}/logo.png`, width: 1200, height: 630, alt: 'Nicaragua Informate' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.titulo,
      description: meta.description,
      images: [`${SITE_URL}/logo.png`],
    },
  };
}

export const revalidate = 60;

export default async function CategoriaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const slugLower = slug.toLowerCase();
  const catName = slugToCategory(slugLower);
  if (!catName) return notFound();

  let noticias: Noticia[] = [];
  let masLeidas: Noticia[] = [];
  try {
    [noticias, masLeidas] = await Promise.all([
      getNewsByCategory(catName, 100),
      getMasLeidas(),
    ]);
  } catch (error) {
    console.error('[CategoriaPage] Error:', error);
  }

  return <MobileHome noticias={noticias} masLeidas={masLeidas} />;
}
