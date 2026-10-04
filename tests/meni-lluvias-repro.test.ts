// @vitest-environment node
// Reproducción DIAGNÓSTICA (temporal): nota de lluvias real del usuario.
// Objetivo: trazar la cadena exacta que bloqueó la publicación.
import { describe, it } from 'vitest';
import { runMeni } from '../lib/meni/core';
import { detectFactualitySignals } from '../lib/editorial/factuality-signals';
import { analyzeTrust } from '../lib/editorial/trust';
import { makeEditorialDecision } from '../lib/supervisor/editorial-supervisor';

const NOTA = {
  titulo: 'Lluvias dejan viviendas afectadas y daños en varios municipios',
  resumen: 'Las lluvias de este sábado 3 de octubre han provocado afectaciones en viviendas, puentes, caminos e infraestructura en varios municipios de Nicaragua.',
  contenido: `<p><strong>Las lluvias registradas este sábado 3 de octubre han dejado afectaciones en viviendas, puentes, caminos e infraestructura en varios municipios de Nicaragua.</strong> El balance disponible reporta al menos 14 viviendas afectadas y dos puentes con daños, además de deslizamientos de tierra, crecidas de ríos, una evacuación y la interrupción temporal del paso vehicular hacia una comunidad.</p>
<h2>Familia evacuada en El Tuma-La Dalia</h2>
<p>En el municipio de El Tuma-La Dalia, una familia de cinco personas fue evacuada luego de que un deslizamiento de tierra afectara su vivienda en la comunidad Tierras Blancas.</p>
<p>En esa misma zona, otros deslizamientos provocaron daños en tres viviendas ubicadas entre las comunidades Yale 4 y La Tronca 2.</p>
<h2>Dos puentes afectados en Siuna</h2>
<p>En Siuna, las crecidas de los ríos ocasionaron daños en los puentes Floripón y El Consuelo, afectando las condiciones de comunicación entre comunidades del municipio.</p>
<h2>Cinco viviendas anegadas en Wiwilí</h2>
<p>En Wiwilí-Jinotega, cinco viviendas resultaron anegadas en la comunidad San Pedro de Kinowas. El ingreso de agua provocó afectaciones en los hogares ubicados en este sector.</p>
<p>Con estas viviendas y las reportadas en El Tuma-La Dalia, el balance detallado confirma afectaciones en al menos nueve casas, mientras el reporte general eleva la cifra a <strong>14 viviendas afectadas</strong> en los diferentes municipios.</p>
<h2>Caída de poste e interrupción del paso</h2>
<p>En Santa María de Pantasma se reportó la caída de un poste del tendido eléctrico. En San Sebastián de Yalí, por su parte, la crecida de una quebrada interrumpió temporalmente el paso vehicular hacia la comunidad Los Aguacatales.</p>
<h2>Antena de radio cae sobre una vivienda</h2>
<p>En Waspam, una antena de radio cayó sobre una vivienda ubicada en el barrio Esteban Jaens y provocó daños parciales en el techo de la casa.</p>
<h2>Balance de las afectaciones</h2>
<p>En total, el reporte disponible contabiliza <strong>al menos 14 viviendas afectadas y dos puentes con daños</strong>, además de afectaciones en el tendido eléctrico, vías de comunicación y otras estructuras.</p>
<p>Los incidentes reportados corresponden principalmente a daños materiales derivados de las lluvias, deslizamientos y crecidas de ríos. El balance puede ampliarse conforme se realicen nuevas evaluaciones en las zonas afectadas.</p>`,
  categoria: 'Sucesos',
  autor: 'Redacción Nicaragua Informate',
  fecha: '2026-10-03T10:00:00Z',
  slug: 'lluvias-viviendas-municipios',
  palabrasClave: ['lluvias en Nicaragua', 'daños por lluvias', 'viviendas afectadas', 'deslizamientos', 'Siuna', 'El Tuma-La Dalia', 'Wiwilí', 'Waspam'],
} as any;

describe('DIAGNÓSTICO nota lluvias — cadena de bloqueo', () => {
  it('traza señales → MENI → Supervisor → decisión de publicación', () => {
    const signals = detectFactualitySignals({ titulo: NOTA.titulo, resumen: NOTA.resumen, contenido: NOTA.contenido });
    console.log('\n=== SEÑALES FACTUALIDAD ===');
    for (const s of signals) console.log(` ${s.severity} ${s.code}: ${s.desc}`);

    const trust = analyzeTrust({ titulo: NOTA.titulo, cuerpo: NOTA.contenido, categoria: 'Sucesos', fuentesExternas: [] });
    console.log('\n=== TRUST ===');
    console.log(' factores:', trust.factores.join(', ') || 'ninguno');
    console.log(' fuentes:', trust.fuentes.join(', ') || 'ninguna', '| nivel:', trust.nivel);

    const meni = runMeni(NOTA);
    console.log('\n=== MENI ===');
    console.log(' aprobado:', meni.aprobado, '| score:', meni.scoreFinal, '| tier:', meni.editorialTier);
    console.log(' blockingIssues:', (meni.blockingIssues || []).map(i => `${i.code}[${i.severity}]`).join(', ') || 'ninguno');
    console.log(' warnings:', (meni.warnings || []).map(i => `${i.code}`).join(', ') || 'ninguno');
    console.log(' dna:', JSON.stringify({ adn: meni.editorialDna?.adnNI, excl: meni.editorialDna?.exclusividad?.score, wow: meni.editorialDna?.wow?.score, transc: meni.editorialDna?.transcripcion?.score }));
    console.log(' veredicto:', meni.editorialVerdict?.decision, '|', (meni.editorialVerdict?.resumen || '').slice(0, 100));

    const sup = makeEditorialDecision({
      titulo: NOTA.titulo, contenido: NOTA.contenido, resumen: NOTA.resumen,
      categoria: 'Sucesos', perfil: 'sucesos',
      scoreMeni: meni.scoreFinal ?? undefined, aprobadoMeni: meni.aprobado,
      factualitySignals: signals,
    } as any);
    console.log('\n=== SUPERVISOR ===');
    console.log(' verdict:', sup.verdict, '| state:', sup.resultingState);
    for (const i of (sup.issues || [])) console.log(`  [${i.severity}] ${i.domain}: ${i.problem}`);
    console.log('\n=== COMPUERTA guardar-directo ===');
    console.log(' meniOk:', meni.aprobado, '| decision:', meni.editorialVerdict?.decision);
    console.log(' canOverride si editorOverride=true:', meni.editorialVerdict?.decision === 'REVISAR');
  });
});
