import type { Metadata } from 'next';
import LegalPageShell from '@/components/LegalPageShell';
import AuthorProfile from '@/components/AuthorProfile';
import { getNews } from '@/lib/data';

export const metadata: Metadata = {
  title: { absolute: 'Keyling Elieth Rivera Muñoz | Directora Editorial | Nicaragua Informate' },
  description:
    'Conoce a Keyling Elieth Rivera Muñoz, Directora Editorial de Nicaragua Informate. Periodista nicaragüense con trayectoria en cobertura de Sucesos, Nacionales, Deportes, Internacionales, Tecnología y Espectáculos.',
  alternates: { canonical: 'https://nicaraguainformate.com/autor/keyling-rivera' },
  openGraph: {
    title: 'Keyling Elieth Rivera Muñoz | Directora Editorial | Nicaragua Informate',
    url: 'https://nicaraguainformate.com/autor/keyling-rivera',
    siteName: 'Nicaragua Informate',
    locale: 'es_NI',
    type: 'profile',
  },
};

export default async function AutorKeylingRiveraPage() {
  let articulos: { id: string; slug: string; titulo: string; fecha: string; categoria: string; imagen: string }[] = [];
  try {
    const noticias = await getNews(100);
    articulos = noticias
      .filter((n) => n.autor?.toLowerCase().includes('keyling') || n.autor?.toLowerCase().includes('rivera'))
      .slice(0, 10)
      .map((n) => ({ id: n.id, slug: n.slug, titulo: n.titulo, fecha: n.fecha, categoria: n.categoria, imagen: n.imagen }));
  } catch {
    articulos = [];
  }

  return (
    <LegalPageShell title="Keyling Elieth Rivera Muñoz — Directora Editorial">
      <AuthorProfile
        name="Keyling Elieth Rivera Muñoz"
        role="Directora Editorial y Cofundadora"
        bio="Periodista nicaragüense, co-fundadora y directora editorial de Nicaragua Informate. Especializada en cobertura de Sucesos, Nacionales, Deportes, Internacionales, Tecnología y Espectáculos. Firme defensora del periodismo verificado, la independencia editorial y el derecho a la información ciudadana en Nicaragua."
        extendedBio="Keyling Elieth Rivera Muñoz ha construido una sólida trayectoria en el periodismo nicaragüense desde 2018, cubriendo con rigor y precisión los acontecimientos más relevantes del país. Su trabajo se distingue por la verificación rigurosa de fuentes, la contextualización profunda de los hechos y el compromiso inquebrantable con la verdad. Como directora editorial de Nicaragua Informate, supervisa cada pieza informativa antes de su publicación, garantizando que cumpla con los estándares de veracidad, precisión y responsabilidad social que rigen al medio. Bajo su liderazgo, el portal ha consolidado una cobertura diaria que abarca desde sucesos de emergencia hasta análisis de política nacional, deportes centroamericanos y tecnología. Ha impulsado la incorporación de datos estructurados, sitemaps dinámicos y optimización SEO como parte de la estrategia de distribución del medio. Ha formado a reporteros en métodos de verificación de fuentes, ética periodística y uso responsable de redes sociales para la difusión de noticias."
        location="Managua, Nicaragua"
        email="redaccion@nicaraguainformate.com"
        photo="/keyling-rivera.jpg"
        initials="KR"
        articles={articulos}
        socials={[
          { name: 'LinkedIn', href: 'https://www.linkedin.com/in/keyling-rivera', icon: 'linkedin' },
          { name: 'X / Twitter', href: 'https://x.com/keylingrivera', icon: 'twitter' },
          { name: 'Web', href: 'https://nicaraguainformate.com/autor/keyling-rivera', icon: 'web' },
        ]}
        specialties={[
          'Cobertura de Sucesos y Seguridad Ciudadana',
          'Noticias Nacionales y Política Local',
          'Deportes Nacionales e Internacionales',
          'Tecnología e Innovación Digital',
          'Espectáculos y Cultura Nicaragüense',
        ]}
        sinceYear="2025"
        education="Universidad Nacional Autónoma de Nicaragua (UNAN-Managua)"
        awards={[
          'Miembro fundador de Nicaragua Informate (2025)',
          'Coordinadora del área editorial del medio desde su lanzamiento',
        ]}
        schemaUrl="https://nicaraguainformate.com/autor/keyling-rivera"
      />
    </LegalPageShell>
  );
}
