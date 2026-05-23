'use client';

import ArticleView from '@/components/ArticleView';
import '@/app/articulo.css';

const noticiaDemo = {
  id: 'demo-1',
  slug: 'kfc-managua-2026',
  titulo: 'KFC anuncia apertura de sus primeros restaurantes en Managua',
  resumen: 'La reconocida cadena internacional de comida rápida KFC confirmó oficialmente su llegada a Nicaragua con la apertura de sus primeros restaurantes en la capital, Managua.',
  contenido: `<p>La reconocida cadena internacional de comida rápida <strong>KFC</strong> confirmó oficialmente su llegada a Nicaragua con la apertura de sus primeros restaurantes en la capital, Managua. La noticia fue recibida con entusiasmo por los consumidores nicaragüenses.</p>

<p>Durante una conferencia de prensa realizada este martes, representantes de la franquicia detallaron que el plan inicial contempla la inauguración de <strong>tres sucursales</strong> estratégicamente ubicadas en zonas de alta afluencia.</p>

<h2>Generación de empleo directo e indirecto</h2>
<p>Una de las noticias más destacadas del anuncio es la creación de aproximadamente <strong>350 puestos de trabajo</strong> en su fase inicial. Los cargos abarcarán desde operarios de cocina y atención al cliente hasta posiciones administrativas.</p>

<blockquote><p>"Nicaragua representa un mercado con enorme potencial. Hemos observado el crecimiento económico sostenido y la apertura de nuevos centros comerciales."</p></blockquote>

<h2>Menú adaptado al paladar nicaragüense</h2>
<p>Aunque el menú mantendrá los clásicos de la marca como el pollo frito original, la gerencia regional adelantó que se incluirán <strong>opciones especiales</strong> pensadas para el mercado local, incluyendo acompañamientos con gallo pinto.</p>

<h3>Fechas de apertura proyectadas</h3>
<ul>
<li><strong>Julio 2026:</strong> Primera sucursal en Carretera a Masaya</li>
<li><strong>Septiembre 2026:</strong> Segunda sucursal en Galerías Santo Domingo</li>
<li><strong>Noviembre 2026:</strong> Tercera sucursal en el centro de Managua</li>
</ul>`,
  categoria: 'Nacionales',
  imagen: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1200&h=600&fit=crop',
  fecha: '2026-05-16T10:00:00Z',
  autor: 'María Elena Sandoval',
  vistas: 1245,
  tags: ['Economía', 'Managua', 'Empleo', 'Inversión extranjera', 'Comercio', 'Franquicias'],
};

const relatedDemo = [
  { id: 'r1', slug: 'hospital-esteli', titulo: 'Inaugurarán Hospital Pediátrico Las Segovias en Estelí', resumen: '...', categoria: 'Nacionales', imagen: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=200&h=200&fit=crop', fecha: '2026-05-16T08:00:00Z' },
  { id: 'r2', slug: 'via-coyotepe', titulo: 'Nueva vía conecta Laureles Sur con carretera a El Coyotepe', resumen: '...', categoria: 'Nacionales', imagen: 'https://images.unsplash.com/photo-1519817914152-22d216bb9170?w=200&h=200&fit=crop', fecha: '2026-05-16T06:00:00Z' },
  { id: 'r3', slug: 'negocios-crecimiento', titulo: 'Pequeños negocios crecen un 12% en el primer trimestre', resumen: '...', categoria: 'Economía', imagen: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&h=200&fit=crop', fecha: '2026-05-15T14:00:00Z' },
];

const trendingDemo = [
  { id: 't1', slug: 'kfc-managua-2026', titulo: 'KFC abrirá sus puertas en Managua este año', resumen: '...', categoria: 'Nacionales', imagen: '', fecha: '2026-05-16T10:00:00Z' },
  { id: 't2', slug: 'hospital-esteli', titulo: 'Hospital Pediátrico Las Segovias: esperanza para el norte', resumen: '...', categoria: 'Nacionales', imagen: '', fecha: '2026-05-16T08:00:00Z' },
  { id: 't3', slug: 'china-cabras', titulo: 'China logra clonación de cabras lecheras', resumen: '...', categoria: 'Tecnología', imagen: '', fecha: '2026-05-16T06:00:00Z' },
  { id: 't4', slug: 'costa-rica-frontera', titulo: 'Costa Rica intensifica operativos en frontera norte', resumen: '...', categoria: 'Internacionales', imagen: '', fecha: '2026-05-15T20:00:00Z' },
];

export default function TestArticulo() {
  return (
    <div style={{ paddingTop: 80 }}>
      <ArticleView noticia={noticiaDemo as any} relatedNews={relatedDemo as any} trendingNews={trendingDemo as any} />
    </div>
  );
}
