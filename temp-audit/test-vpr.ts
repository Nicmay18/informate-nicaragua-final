import { analizarNoticia, type NoticiaInput } from '../lib/analizador-noticias';

const noticia: NoticiaInput = {
  titulo: 'Cuatro accidentes de tránsito en Managua dejan varios heridos',
  contenido: `
    <p>En horas de la mañana de este viernes se registraron cuatro accidentes de tránsito en distintos puntos de Managua, dejando al menos seis personas heridas, según reportes preliminares de testigos en el lugar.</p>
    <h2>Hechos principales</h2>
    <p>Los incidentes ocurrieron en la carretera Norte, la Rotonda Rubén Darío, el Mercado Oriental y la Pista de la Resistencia. En todos los casos se vio involucrado exceso de velocidad y conducir distraído, según versiones de conductores.</p>
    <h2>Contexto</h2>
    <p>Estos accidentes se suman a una estadística preocupante: en los últimos tres meses se han reportado más de 150 incidentes viales con heridos en la capital, según datos de la Policía Nacional de Tránsito. La cifra representa un aumento del 12% respecto al mismo período del año anterior.</p>
    <h2>Reacciones</h2>
    <p>Un comerciante del Mercado Oriental indicó que la falta de señalización contribuye a los choques. Nicaragua Informate pudo constatar en el lugar que varias señales están caídas o deterioradas.</p>
  `,
  resumen: 'Cuatro accidentes de tránsito en Managua dejan varios heridos este viernes.',
  categoria: 'Sucesos',
  autor: 'Redacción NI',
  fecha: new Date().toISOString(),
  slug: 'cuatro-accidentes-managua',
  imagenDestacada: 'https://example.com/imagen.jpg',
};

async function main() {
  const resultado = await analizarNoticia(noticia);
  console.log('Nivel:', resultado.nivel);
  console.log('Puntuación general:', resultado.puntuacion);
  console.log('--- REPORTE EDITOR JEFE IA ---');
  console.log(JSON.stringify(resultado.reporteVPR, null, 2));
}

main().catch(console.error);
