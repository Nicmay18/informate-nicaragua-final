// Genera el diff exacto por artículo (simulación sobre snapshot read-only).
import { readFileSync, writeFileSync } from 'node:fs';

const snap = JSON.parse(readFileSync('.audit/afectado-p21-snapshot.json', 'utf8'));
const dec = JSON.parse(readFileSync('repair-afectado-decisiones.json', 'utf8'));
const strip = (h) => String(h || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

const EXTRA = {
  'tres-fallecidos-en-hechos-viales-este-viernes-en-managua-y-granada': [
    ['resultó gravemente afectado Ronaldo Jossyel Espinoza López', 'falleció Ronaldo Jossyel Espinoza López'],
  ],
  'investigaciones-por-fallecimiento-en-barrio-old-bank-bluefields': [
    ['afectadas punzocortantes', 'heridas punzocortantes'],
    ['la persona afectada no se metia', 'el fallecido no se metía'],
    ['Familiares del afectado', 'Familiares del fallecido'],
  ],
  'naufragio-en-caribe-norte-deja-mujer-muerta-y-dos-ninos-desaparecidos': [
    ['Las personas afectadas fueron identificadas', 'Las fallecidas fueron identificadas'],
  ],
  'dos-fallecidos-en-accidentes-ocurridos-en-matagalpa-y-wiwili': [
    ['la madre de la persona afectada', 'la madre del fallecido'],
  ],
  'nicaraguense-fallece-en-accidente-laboral-en-wisconsin': [
    ['los parientes de la resultó afectada', 'los parientes de la fallecida'],
    ['la persona afectada era originaria', 'la fallecida era originaria'],
    ['La persona afectada se dedicaba', 'La fallecida se dedicaba'],
    ['situación familiar de la afectada', 'situación familiar de la fallecida'],
  ],
  'cuatro-nicaraguenses-mueren-en-el-exterior-en-menos-de-una': [
    ['Las familias de los cuatro afectados', 'Las familias de los cuatro fallecidos'],
    ['tras ser persona afectada de un accidente', 'tras ser víctima de un accidente'],
    ['ciudadanos afectados en el exterior', 'fallecidos en el exterior'],
  ],
  'dos-hombres-mueren-por-descargas-electricas-en-managua': [
    ['la persona afectada se encontraba realizando labores', 'el fallecido se encontraba realizando labores'],
  ],
  'dos-muertos-y-dos-heridos-en-accidentes-laborales-en-nicaragua': [
    ['resultó gravemente afectado tras recibir una fuerte descarga', 'resultó gravemente herido tras recibir una fuerte descarga'],
    ['resultó gravemente afectado tras sufrir una caída', 'falleció tras sufrir una caída'],
    ['resultó gravemente afectado al caer desde el segundo piso', 'resultó herido al caer desde el segundo piso'],
  ],
  'lluvias-vientos-y-rayos-dejan-danos-y-dos-fallecidos': [
    ['La persona afectada fue identificada como Kevin Fabricio Pérez Hernández', 'El segundo fallecido fue identificado como Kevin Fabricio Pérez Hernández'],
  ],
};

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const flex = (p) => new RegExp(p.split(/\s+/).map(esc).join('(?:\\s|<\\/?(?:strong|em|b|i|span)[^>]*>)+'), 'gi');

const CONF = dec.fichas.filter((f) => f.clasificacion.startsWith('CONFIRMADO') && f.find && f.correccion);
const byDoc = {};
for (const f of CONF) (byDoc[f.articuloId] ||= { slug: f.slug, patches: [] }).patches.push([f.find, f.correccion]);
for (const [id, i] of Object.entries(byDoc)) for (const p of EXTRA[i.slug] || []) i.patches.push(p);

let md = '# Diff exacto por artículo — fase P2\n';
md += 'Simulación sobre snapshot read-only (.audit/afectado-p21-snapshot.json).\n\n';
let total = 0; const counts = {};
for (const [id, info] of Object.entries(byDoc)) {
  const d = snap.documents.find((x) => x.id === id);
  if (!d) { md += `## ${info.slug}\n- DOC NO EN SNAPSHOT\n\n`; continue; }
  md += `## ${info.slug}\n`;
  let n = 0;
  for (const field of ['titulo', 'resumen', 'contenido']) {
    let text = String(d.data[field] || '');
    for (const [find, rep] of info.patches) {
      const re = flex(find);
      let m;
      while ((m = re.exec(text))) {
        const ctx = strip(text.slice(Math.max(0, m.index - 70), m.index + m[0].length + 70));
        md += `- **[${field}]** «…${ctx}…»\n  - \`${find}\` ⇒ \`${rep}\`\n`;
        n++; total++;
      }
      text = text.replace(flex(find), rep);
    }
  }
  md += '\n';
  counts[info.slug] = n;
}
md += '\n## Totales\n\n';
for (const [s, n] of Object.entries(counts)) md += `- ${s}: ${n} reemplazos\n`;
md += `\n**TOTAL: ${total} reemplazos en ${Object.keys(counts).length} artículos**\n`;
writeFileSync('.audit/p2-diff-exacto.md', md);
console.log('reemplazos totales simulados:', total, '| docs:', Object.keys(counts).length);
