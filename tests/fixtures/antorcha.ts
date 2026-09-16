// tests/fixtures/antorcha.ts
// Caso real/sintético de la noticia "Antorcha Centroamericana"
// usado para validar PK_TRUNCATED, PK_ENDS_WITH_PREPOSITION y reparación segura.

import type { Noticia } from '@/lib/types';

export const antorchaContenido = `<p>La Antorcha Centroamericana recorrerá Nicaragua del 10 al 13 de septiembre, luego de ingresar al país por la frontera norte de Las Manos y antes de ser entregada a las autoridades de Educación de Costa Rica en Peñas Blancas.</p>
<p>En el empalme de San Benito, Boaco, el diputado Juan Hernández entregó la antorcha al delegado de Jinotega en el peaje de Las Lomas, cerca de la carretera Panamericana.</p>
<p>La antorcha centroamericana simboliza la unión de los pueblos centroamericanos y llegará a Costa Rica el próximo viernes, según anunciaron los organizadores del evento.</p>`;

export const antorchaPuntosClaveTruncados = [
  'La Antorcha Centroamericana recorrerá Nicaragua del 10 al 13 de septiembre, luego de ingresar al país por.',
  'En el empalme de San Benito, Boaco, el diputado Juan Hernández entregó la antorcha al delegado de Jinotega en.',
  'La antorcha centroamericana simboliza la unión de los pueblos centroamericanos y llegará a Costa Rica el.',
];

export const antorchaNoticia: Noticia = {
  id: 'antorcha-test-001',
  slug: 'antorcha-centroamericana-recorrera-nicaragua-del-10-al-13',
  titulo: 'Antorcha Centroamericana recorrerá Nicaragua del 10 al 13 de septiembre',
  resumen: 'La Antorcha Centroamericana recorrerá Nicaragua del 10 al 13 de septiembre y será entregada a Costa Rica en Peñas Blancas tras un recorrido por el norte del país. La iniciativa busca fortalecer la unión de los pueblos centroamericanos.',
  contenido: antorchaContenido,
  imagen: 'https://cdn.example/antorcha.jpg',
  categoria: 'Nacionales',
  estado: 'publicado',
  fecha: new Date().toISOString(),
  fuente: 'Ministerio de Educación de Nicaragua',
  puntosClave: antorchaPuntosClaveTruncados,
};

export const antorchaFuenteOrigen = {
  primerPunto:
    'La Antorcha Centroamericana recorrerá Nicaragua del 10 al 13 de septiembre, luego de ingresar al país por la frontera norte de Las Manos y antes de ser entregada a las autoridades de Educación de Costa Rica en Peñas Blancas.',
  segundoPunto:
    'En el empalme de San Benito, Boaco, el diputado Juan Hernández entregó la antorcha al delegado de Jinotega en el peaje de Las Lomas, cerca de la carretera Panamericana.',
  tercerPunto:
    'La antorcha centroamericana simboliza la unión de los pueblos centroamericanos y llegará a Costa Rica el próximo viernes, según anunciaron los organizadores del evento.',
};
