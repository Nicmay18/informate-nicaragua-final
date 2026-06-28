import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function validar8Criterios(n) {
  const texto = n.contenido || '';
  const palabras = texto.trim().split(/\s+/).filter(w => w.length > 0).length;
  const parrafos = texto.split(/\n+/).filter(p => p.trim().length > 20);
  const lead = parrafos[0] || '';
  const palabrasLead = lead.trim().split(/\s+/).filter(w => w.length > 0).length;
  const tieneH2 = /<h2[^>]*>/i.test(texto);
  const tieneStrong = /<strong>/i.test(texto) || /<b>/i.test(texto);
  const tieneDatos = /\d/.test(texto);
  const citas = (texto.match(/["\u201c][^"\u201d]{8,}["\u201d]/g) || []).length;
  const atribuciones = /inform[oó]|confirm[oó]|declar[oó]|precis[oó]|señal[oó]|indic[oó]|dijo|explic[oó]|manifest[oó]|afirm[oó]|agreg[oó]|asegur[oó]|destac[oó]|mencion[oó]|aclar[oó]|coment[oó]|expres[oó]|anunc[ió]|revel[oó]/i.test(texto);
  const blockquotes = (texto.match(/<blockquote>/g) || []).length;
  const passCitas = citas >= 1 || atribuciones || blockquotes >= 1;
  const titulo = n.titulo || '';
  const tituloOK = titulo.length >= 50 && titulo.length <= 70;
  const meta = n.resumen || '';
  const metaOK = meta.length >= 150 && meta.length <= 170;
  const tieneImagen = n.imagenDestacada && n.imagenDestacada.length > 5;

  const criterios = {
    contenido: { ok: palabras >= 500, actual: palabras, esperado: 500 },
    lead: { ok: palabrasLead >= 35, actual: palabrasLead, esperado: 35 },
    h2: { ok: tieneH2, actual: tieneH2 ? 'Sí' : 'No', esperado: 'Sí' },
    strong: { ok: tieneStrong || tieneDatos, actual: tieneStrong ? 'Sí' : (tieneDatos ? 'Datos numéricos' : 'No'), esperado: 'Sí' },
    citas: { ok: passCitas, actual: citas, esperado: '>=1' },
    titulo: { ok: tituloOK, actual: titulo.length, esperado: '50-70' },
    meta: { ok: metaOK, actual: meta.length, esperado: '150-170' },
    imagen: { ok: tieneImagen, actual: tieneImagen ? 'Sí' : 'No', esperado: 'Sí' },
  };

  const aprobados = Object.values(criterios).filter(c => c.ok).length;
  const nivel = aprobados >= 7 ? 'ORO' : (aprobados >= 5 ? 'PLATA' : 'BRONCE');
  const faltantes = Object.entries(criterios).filter(([,c]) => !c.ok).map(([k]) => k);

  return { nivel, aprobados, faltantes, criterios, palabras, titulo: n.titulo, id: n.id, slug: n.slug };
}

const noticias = JSON.parse(readFileSync(path.join(__dirname, 'backup-noticias-2026-06-14.json'), 'utf8'));
const evaluadas = noticias.map(n => ({ ...n, ...validar8Criterios(n) }));

const autoFixables = evaluadas.filter(n => {
  if (n.nivel === 'ORO') return false;
  const f = n.faltantes;
  return f.every(x => ['h2','citas','strong','meta','titulo','imagen'].includes(x)) && !f.includes('contenido') && !f.includes('lead');
}).sort((a, b) => b.aprobados - a.aprobados);

console.log('══════════════════════════════════════════════════════════════════');
console.log(`  LISTA DE ${autoFixables.length} NOTICIAS — CORRECCIÓN AUTOMÁTICA POSIBLE`);
console.log('══════════════════════════════════════════════════════════════════\n');

for (let i = 0; i < autoFixables.length; i++) {
  const n = autoFixables[i];
  const fixes = n.faltantes.map(f => {
    if (f === 'h2') return 'insertar h2';
    if (f === 'citas') return 'agregar cita/atribución';
    if (f === 'strong') return 'agregar <strong> o datos numéricos';
    if (f === 'meta') return 'ajustar meta 150-170 chars';
    if (f === 'titulo') return 'ajustar título 50-70 chars';
    if (f === 'imagen') return 'verificar imagen destacada';
    return f;
  }).join(' + ');

  console.log(`${String(i+1).padStart(2)}. [${n.nivel} | ${n.aprobados}/8] ${n.titulo.substring(0, 70)}`);
  console.log(`    ID: ${n.id}`);
  console.log(`    Palabras: ${n.palabras} | Falta: ${fixes}`);
  console.log('');
}

process.exit(0);
