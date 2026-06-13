import { analizarNoticia } from './lib/analizador-noticias.ts';

const noticia = {
  titulo: 'Cinco fallecimientos en 24 horas por accidentes de tránsito',
  contenido: `<p>Cinco personas fallecieron entre la noche del domingo 6 y la madrugada del lunes 7 de abril de 2025 en accidentes de tránsito ocurridos en Managua, Madriz, Chontales y la Costa Caribe Norte, según reportes oficiales de la Policía Nacional.</p>

<h2>Accidentes reportados este 7 de abril en Nicaragua</h2>
<p>Según la Policía Nacional, los accidentes ocurrieron en distintos puntos de la red vial nacional y dejaron cinco víctimas mortales en menos de 24 horas.</p>
<p>De acuerdo con reportes oficiales, cuatro de los fallecidos se movilizaban en motocicleta como conductores o pasajeros, mientras una de las víctimas murió tras ser atropellada por un vehículo.</p>

<h2>Atropello deja un fallecido en Palacagüina</h2>
<p>El caso más reciente ocurrió a las 03:30 horas del lunes 7 de abril en el kilómetro 190 de la carretera Panamericana, en la comunidad Ducualí, municipio de Palacagüina, departamento de Madriz.</p>

<h2>Motociclista fallece en Villa El Carmen</h2>
<p>La víctima fue identificada como Yorlan Francisco Sáenz Rivera, de 27 años.</p>

<h2>Dos hombres fallecen en accidente de motocicleta en El Ayote</h2>
<p>Las víctimas fueron identificadas como Juan Antonio Morales Rocha, de 34 años, y Fernando Amador Marín, de 41 años.</p>

<h2>Adolescente fallece en la Costa Caribe Norte</h2>
<p>La quinta víctima fue José Leopoldo Martínez Castell, de 17 años.</p>

<h2>Policía mantiene investigaciones abiertas</h2>
<p>La Dirección de Seguridad de Tránsito Nacional mantiene abiertas las investigaciones.</p>

<h2>Fuente oficial de la información</h2>
<p>La información fue elaborada con base en reportes oficiales de la Dirección de Seguridad de Tránsito Nacional.</p>`,
  resumen: 'Cinco personas perdieron la vida en distintos accidentes de tránsito ocurridos en las últimas 24 horas en Nicaragua. Cuatro de las víctimas se movilizaban en motocicleta.',
  categoria: 'Sucesos',
  autor: 'Nicaragua Informate',
  fecha: '2025-04-07',
  slug: 'cinco-fallecidos-accidentes-transito-nicaragua',
};

analizarNoticia(noticia).then(r => {
  console.log('\n=== RESULTADO ===');
  console.log('Nivel:', r.nivel);
  console.log('Puntuación:', r.puntuacion);
  console.log('Aprobado:', r.aprobado);
  console.log('\n--- FILTRO ORO ---');
  r.filtros.oro.checks.forEach(c => {
    console.log(`${c.estado} | ${c.nombre}: ${c.mensaje}`);
  });
  console.log('\n--- FILTRO AdSense ---');
  r.filtros.adsense.checks.forEach(c => {
    console.log(`${c.estado} | ${c.nombre}: ${c.mensaje}`);
  });
});
