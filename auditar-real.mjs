import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { writeFileSync } from 'fs';

const firebaseConfig = {
  apiKey: "AIzaSyDVsqRGr7dtdi5ecO14THIdbnEzZKOJxcA",
  authDomain: "informate-instant-nicaragua.firebaseapp.com",
  projectId: "informate-instant-nicaragua",
  storageBucket: "informate-instant-nicaragua.firebasestorage.app",
  messagingSenderId: "24988088146",
  appId: "1:24988088146:web:d26a207508da055668ec8b",
  measurementId: "G-W1B5J61WEP"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ─── DETECTORES ───
const TRANSICIONES_IA = ['además', 'por su parte', 'asimismo', 'en consecuencia',
  'es importante destacar', 'cabe señalar', 'por lo tanto', 'no obstante',
  'finalmente', 'sin embargo', 'por otro lado', 'en este sentido', 'en primer lugar',
  'en segundo lugar', 'dicho esto', 'de igual manera', 'en tanto que', 'así mismo',
  'de la misma forma', 'en contraste', 'por ende', 'consecuentemente'];

const RELLENO_EMO = ['tragedia', 'trágico', 'trágica', 'consternación', 'consternada',
  'consternado', 'dolor', 'dolorosa', 'doloroso', 'lamentan', 'lamentable',
  'lamentablemente', 'perdió la batalla', 'perdió la vida', 'vida truncada',
  'jóven promesa', 'honras fúnebres', 'cristiana sepultura', 'amado', 'querido',
  'enluta', 'profundo dolor', 'profunda conmoción', 'asombro', 'indignación',
  'escandalizado', 'coraje', 'rabia', 'impotencia', 'tristeza', 'devastado',
  'desolado', 'pesar', 'pesaroso', 'pena', 'luto', 'duelo', 'funesto'];

function limpiarHTML(texto) {
  if (!texto) return '';
  return texto
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function contarPalabrasReales(texto) {
  const limpio = limpiarHTML(texto);
  // Solo palabras con al menos 2 caracteres alfabéticos (evita "a", "el" contados mal)
  const palabras = limpio.match(/\b[a-zA-ZáéíóúñÁÉÍÓÚÑ]{2,}\b/g) || [];
  return palabras.length;
}

function analizarQuirurgico(n) {
  // Buscar el campo de contenido real
  const textoOriginal = n.contenido || n.cuerpo || n.texto || n.body || '';
  const textoLimpio = limpiarHTML(textoOriginal).toLowerCase();

  const palabras = contarPalabrasReales(textoOriginal);

  // Detectar relleno (coincidencia exacta de palabra, no substring)
  const rellenoEncontrado = RELLENO_EMO.filter(p => {
    const regex = new RegExp(`(?<![a-zA-ZáéíóúñÁÉÍÓÚÑ])${p}(?![a-zA-ZáéíóúñÁÉÍÓÚÑ])`, 'gi');
    return regex.test(textoLimpio);
  });

  // Detectar transiciones IA
  const transicionesEncontradas = TRANSICIONES_IA.filter(t => textoLimpio.includes(t));

  // Detectar fuentes reales (nombres propios seguidos de verbos de declaración)
  const fuentesReales = (textoLimpio.match(/(comisionado|comisionada|director|directora|jefe|jefa|vocero|vocera|alcalde|alcaldesa|ministro|ministra|doctor|doctora|ingeniero|subcomisionado|delegado|fiscal|agente|oficial)\s+[a-záéíóúñ]+\s+(indicó|señaló|afirmó|declaró|confirmó|dijo|manifestó|expresó|precisó|detalló|explicó|agregó)/gi) || []).length;

  // Citas textuales reales (comillas con atribución)
  const citasReales = (textoLimpio.match(/"[^"]{10,200}"\s*(indicó|señaló|dijo|manifestó|afirmó|precisó|expresó)/gi) || []).length;

  // Verificar estructura periodística básica
  const tieneLead = /^(en|la|el|los|las|un|una|dos|tres|más|hoy|este|ayer|la madrugada|la mañana|la tarde|la noche|policía|autoridades|fiscalía|ministerio|hospital|bomberos|sujeto|hombre|mujer|joven|adulto|niño|niña|personas|familiares|vecinos|testigos)/i.test(limpiarHTML(textoOriginal));

  // Calcular nivel REAL
  let problemas = [];
  let nivelReal = '🟠 ORO';
  let scoreReal = 95;

  if (palabras < 350) {
    problemas.push(`FALTA DESARROLLO: solo ${palabras} palabras (mínimo 350)`);
    nivelReal = '🔴 PELIGRO';
    scoreReal = 40;
  } else if (palabras < 500) {
    problemas.push(`DESARROLLO INSUFICIENTE: ${palabras} palabras (recomendado 500+)`);
    if (nivelReal === '🟠 ORO') { nivelReal = '🟡 BRONCE'; scoreReal = 55; }
  }

  if (rellenoEncontrado.length > 0) {
    problemas.push(`RELLENO EMOCIONAL: ${rellenoEncontrado.join(', ')}`);
    if (nivelReal === '🟠 ORO') { nivelReal = '🟡 BRONCE'; scoreReal = 50; }
    else if (scoreReal > 40) scoreReal -= 10;
  }

  if (transicionesEncontradas.length > 2) {
    problemas.push(`RASTROS DE IA: ${transicionesEncontradas.slice(0,3).join(', ')}${transicionesEncontradas.length>3?'...':''}`);
    if (nivelReal === '🟠 ORO') { nivelReal = '🟡 BRONCE'; scoreReal = 50; }
  }

  if (fuentesReales === 0 && palabras >= 350) {
    problemas.push('SIN FUENTES ATRIBUIDAS: no hay declaraciones con nombre y cargo');
    // No baja a PELIGRO solo por esto, pero marca
  }

  if (!tieneLead && palabras >= 350) {
    problemas.push('LEAD DEFICIENTE: no responde qué/cuándo/dónde en el primer párrafo');
  }

  return {
    id: n.id,
    titulo: n.titulo || 'Sin título',
    palabrasReales: palabras,
    relleno: rellenoEncontrado,
    transiciones: transicionesEncontradas,
    fuentes: fuentesReales,
    citas: citasReales,
    tieneLead,
    nivelReal,
    scoreReal,
    problemas,
    camposDisponibles: Object.keys(n).filter(k => typeof n[k] === 'string' && n[k].length > 50)
  };
}

async function main() {
  console.log('🔬 AUDITORÍA QUIRÚRGICA — Conteo real de palabras');
  console.log('=' .repeat(50));

  const snapshot = await getDocs(collection(db, 'noticias'));
  const noticias = [];
  snapshot.forEach(d => noticias.push({ id: d.id, ...d.data() }));

  console.log(`📰 Total noticias: ${noticias.length}\n`);

  const auditoria = noticias.map(analizarQuirurgico);

  // Estadísticas
  const enPeligro = auditoria.filter(a => a.nivelReal.includes('PELIGRO'));
  const enBronce = auditoria.filter(a => a.nivelReal.includes('BRONCE'));
  const enOro = auditoria.filter(a => a.nivelReal.includes('ORO'));

  console.log('📊 RESULTADOS REALES:');
  console.log(`   🔴 PELIGRO: ${enPeligro.length} (falta desarrollo o relleno grave)`);
  console.log(`   🟡 BRONCE:  ${enBronce.length} (problemas menores de calidad)`);
  console.log(`   🟠 ORO:     ${enOro.length} (aprobado)`);
  console.log(`   ─────────────────────────`);
  console.log(`   TOTAL:     ${auditoria.length}\n`);

  // Detalle de las que fallan
  if (enPeligro.length > 0) {
    console.log('🔴 NOTICIAS EN PELIGRO (<350 palabras o relleno grave):');
    enPeligro.forEach(a => {
      console.log(`\n   ❌ ${a.titulo.substring(0,60)}...`);
      console.log(`      ID: ${a.id}`);
      console.log(`      Palabras: ${a.palabrasReales}`);
      console.log(`      Problemas: ${a.problemas.join(' | ')}`);
    });
  }

  if (enBronce.length > 0) {
    console.log(`\n🟡 NOTICIAS EN BRONCE (${enBronce.length}):`);
    enBronce.slice(0,10).forEach(a => {
      console.log(`   ⚠️  ${a.titulo.substring(0,60)}... (${a.palabrasReales} palabras) — ${a.problemas[0]}`);
    });
    if (enBronce.length > 10) console.log(`   ... y ${enBronce.length - 10} más`);
  }

  // Guardar JSON completo
  writeFileSync('g:/RESPALDO/informate-nicaragua-final/auditoria-real.json', JSON.stringify(auditoria, null, 2));
  console.log(`\n✅ Auditoría guardada en auditoria-real.json`);

  // Generar archivo de prompts para las que fallan
  const aReescribir = [...enPeligro, ...enBronce];
  if (aReescribir.length > 0) {
    let html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Reescribir ${aReescribir.length} noticias</title>
<style>
body{font-family:system-ui;background:#0f172a;color:#e2e8f0;padding:20px;max-width:900px;margin:0 auto}
.noticia{background:#1e293b;border-radius:12px;padding:20px;margin-bottom:20px;border-left:4px solid #ef4444}
.titulo{font-size:18px;font-weight:700;color:#f8fafc;margin-bottom:8px}
.meta{color:#94a3b8;font-size:13px;margin-bottom:12px}
.prompt{background:#020617;border:1px solid #334155;padding:16px;border-radius:8px;font-family:monospace;font-size:12px;white-space:pre-wrap;max-height:400px;overflow-y:auto}
.btn{background:#ef4444;color:#fff;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;font-weight:600}
</style></head><body>
<h1>🔴 Reescribir ${aReescribir.length} Noticias</h1>
<p style="color:#94a3b8;margin-bottom:20px">Regla de oro: NO inventar datos. Expandir con contexto real de Nicaragua.</p>`;

    aReescribir.forEach((a, idx) => {
      const n = noticias.find(x => x.id === a.id);
      const contenido = n?.contenido || n?.cuerpo || n?.texto || 'SIN CONTENIDO';
      const prompt = `REESCRIBÍ ESTA NOTICIA A NIVEL ORO. Reglas:
1. Mínimo 500 palabras. Actual: ${a.palabrasReales} palabras.
2. NO inventes nombres, edades, cargos ni citas que no estén en el texto original.
3. Expandí con contexto VERIFICABLE: geografía local, antecedentes del lugar, datos históricos de dominio público, estadísticas oficiales si aplica.
4. Sin relleno emocional: prohibido "tragedia", "dolor", "consternación", "perdió la vida".
5. Sin transiciones robóticas: prohibido "además", "por otro lado", "sin embargo", "asimismo".
6. Título: máximo 12 palabras, específico.
7. Lead: 30-45 palabras. Qué, dónde, cuándo, quién.
8. Cuerpo: párrafos cortos, orden cronológico o por relevancia.
9. Si hay nombres reales en el original, mantenelos. Si NO hay, NO inventes.
10. Estilo objetivo, tercera persona, hechos no opiniones.
11. Al final: SLUG y META descripción.

CONTENIDO ACTUAL:
Título: ${n?.titulo || ''}
Texto: ${contenido.substring(0, 800)}${contenido.length>800?'...':''}

FORMATO DE SALIDA:
TÍTULO:
RESUMEN:
CUERPO:
SLUG:
META:`;

      html += `<div class="noticia">
<div class="titulo">${idx+1}. ${a.titulo}</div>
<div class="meta">ID: ${a.id} | ${a.palabrasReales} palabras | Problemas: ${a.problemas.join(', ')}</div>
<div class="prompt">${prompt.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>
</div>`;
    });

    html += '</body></html>';
    writeFileSync('g:/RESPALDO/informate-nicaragua-final/reescribir-noticias.html', html);
    console.log(`📄 Prompts generados: reescribir-noticias.html (${aReescribir.length} noticias)`);
  }
}

main().catch(err => { console.error('❌', err); process.exit(1); });
