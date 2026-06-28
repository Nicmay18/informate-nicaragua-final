/**
 * VALIDADOR PRE-PUBLICACIÓN
 * Usá este script ANTES de subir una noticia a Firestore.
 * Te dice exactamente qué le falta para ser ORO.
 *
 * Uso: node validar-antes-de-publicar.mjs "titulo" "texto completo"
 * O editá la sección TEST debajo y ejecutalo.
 */

const TRANSICIONES_IA = ['además', 'por su parte', 'asimismo', 'en consecuencia',
  'es importante destacar', 'cabe señalar', 'por lo tanto', 'no obstante',
  'finalmente', 'sin embargo', 'por otro lado', 'en este sentido', 'en primer lugar',
  'en segundo lugar', 'dicho esto', 'de igual manera', 'en tanto que', 'así mismo',
  'de la misma forma', 'en contraste', 'por ende', 'consecuentemente',
  'en conclusión', 'para finalizar', 'en resumen', 'de hecho', 'en efecto',
  'a su vez', 'en el marco de', 'en el contexto de'];

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
  const palabras = limpio.match(/\b[a-zA-ZáéíóúñÁÉÍÓÚÑ]{2,}\b/g) || [];
  return palabras.length;
}

function validarNoticia(titulo, contenido) {
  const textoLimpio = limpiarHTML(contenido).toLowerCase();
  const palabras = contarPalabrasReales(contenido);

  const errores = [];
  const advertencias = [];

  // 1. Palabras mínimas
  if (palabras < 350) {
    errores.push(`❌ FATAL: ${palabras} palabras (mínimo 350, recomendado 500+)`);
  } else if (palabras < 500) {
    advertencias.push(`⚠️  ${palabras} palabras (recomendado 500+ para ORO seguro)`);
  }

  // 2. Relleno emocional
  const rellenoEncontrado = RELLENO_EMO.filter(p => {
    const regex = new RegExp(`(?<![a-zA-ZáéíóúñÁÉÍÓÚÑ])${p}(?![a-zA-ZáéíóúñÁÉÍÓÚÑ])`, 'gi');
    return regex.test(textoLimpio);
  });
  if (rellenoEncontrado.length > 0) {
    errores.push(`❌ RELLENO EMOCIONAL: ${rellenoEncontrado.join(', ')}`);
  }

  // 3. Transiciones IA
  const transicionesEncontradas = TRANSICIONES_IA.filter(t => textoLimpio.includes(t));
  if (transicionesEncontradas.length > 0) {
    errores.push(`❌ TRANSICIONES IA: ${transicionesEncontradas.slice(0, 3).join(', ')}${transicionesEncontradas.length > 3 ? '...' : ''}`);
  }

  // 4. Lead
  const tieneLead = /^(en|la|el|los|las|un|una|dos|tres|más|hoy|este|ayer|la madrugada|la mañana|la tarde|la noche|policía|autoridades|fiscalía|ministerio|hospital|bomberos|sujeto|hombre|mujer|joven|adulto|niño|niña|personas|familiares|vecinos|testigos)/i.test(limpiarHTML(contenido));
  if (!tieneLead) {
    advertencias.push(`⚠️  LEAD: el primer párrafo no empieza con respuesta a qué/cuándo/dónde`);
  }

  // 5. Fuentes (V3: generic accepted, no invented names required)
  const fuentesGenericas = /autoridades competentes|fuentes no especificadas|policía nacional|cuerpo de bomberos|asamblea nacional|ministerio de salud|minsa|fiscalía|procuraduría/i.test(textoLimpio);
  const fuentesReales = (textoLimpio.match(/(comisionado|comisionada|director|directora|jefe|jefa|vocero|vocera|alcalde|alcaldesa|ministro|ministra|doctor|doctora|ingeniero|subcomisionado|delegado|fiscal|agente|oficial|diputado|diputada)\s+[a-záéíóúñ]+\s+(indicó|señaló|afirmó|declaró|confirmó|dijo|manifestó|expresó|precisó|detalló|explicó|agregó)/gi) || []).length;
  if (!fuentesGenericas && fuentesReales === 0) {
    advertencias.push(`⚠️  SIN FUENTES: agregar al menos "Autoridades competentes investigan el hecho" o "Fuentes: no especificadas en el hecho base"`);
  }

  // 6. Citas textuales (V3: optional, only if in base case)
  const citasReales = (textoLimpio.match(/"[^"]{10,200}"\s*(indicó|señaló|dijo|manifestó|afirmó|precisó|expresó)/gi) || []).length;
  if (citasReales > 0) {
    // Cita presente, OK
  }

  // 7. Datos concretos (edades, horas, cantidades) - only warn if completely absent
  const tieneEdad = /\b\d{1,3}\s+años?\b/i.test(textoLimpio);
  const tieneHora = /\b\d{1,2}:\d{2}\b/.test(contenido);
  const tieneNumero = /\b\d{2,6}\b/.test(contenido);
  if (!tieneEdad && !tieneHora && !tieneNumero) {
    advertencias.push(`⚠️  DATOS: no se detectan edades, horas o cantidades específicas`);
  }

  // 8. V3 check: invented statistics
  const inventedStats = /ineter\s+reportó|policía\s+nacional\s+reportó\s+\d+|ministerio\s+de\s+salud\s+reportó\s+\d+|datos\s+del\s+ineter|según\s+estadísticas\s+de/i.test(textoLimpio);
  if (inventedStats) {
    errores.push(`❌ DATOS INVENTADOS: detecté referencias a estadísticas de INETER, Policía o Ministerio que pueden ser inventadas`);
  }

  // 9. V3 anti-hallucination checks
  const inventedNamePattern = /un\s+joven\s+de\s+\d+\s+años\s+identificado\s+como|una\s+mujer\s+de\s+\d+\s+años\s+identificada\s+como|la\s+víctima\s+fue\s+identificada\s+como\s+[a-záéíóúñ]+\s+[a-záéíóúñ]+/i;
  if (inventedNamePattern.test(textoLimpio)) {
    advertencias.push(`⚠️  POSIBLE NOMBRE INVENTADO: verificar que los nombres completos estén en el caso base`);
  }
  const inventedTimePattern = /a\s+las\s+\d{1,2}:\d{2}\s+(am|pm|horas)/i;
  const baseCaseTimePattern = /(a\s+las|ocurrió\s+a\s+las)\s+\d{1,2}:\d{2}/i;
  if (inventedTimePattern.test(textoLimpio) && !baseCaseTimePattern.test(textoLimpio)) {
    advertencias.push(`⚠️  POSIBLE HORARIO INVENTADO: verificar que la hora exacta esté en el caso base`);
  }

  // 8. Título largo
  const palabrasTitulo = (titulo.match(/\b\w+\b/g) || []).length;
  if (palabrasTitulo > 12) {
    advertencias.push(`⚠️  TÍTULO: ${palabrasTitulo} palabras (recomendado máximo 12)`);
  }

  // Resultado
  console.log('\n═══════════════════════════════════════════════');
  console.log(`  VALIDACIÓN: ${titulo.substring(0, 50)}...`);
  console.log('═══════════════════════════════════════════════');
  console.log(`\n📊 Palabras: ${palabras}`);
  console.log(`📊 Fuentes: ${fuentesReales}`);
  console.log(`📊 Citas: ${citasReales}`);

  if (errores.length > 0) {
    console.log('\n🔴 ERRORES (DEBEN corregirse antes de publicar):');
    errores.forEach(e => console.log(`   ${e}`));
  }

  if (advertencias.length > 0) {
    console.log('\n⚠️  ADVERTENCIAS (recomendado corregir):');
    advertencias.forEach(a => console.log(`   ${a}`));
  }

  if (errores.length === 0 && advertencias.length === 0) {
    console.log('\n✅ NOTICIA LISTA PARA PUBLICAR — NIVEL ORO');
  } else if (errores.length === 0) {
    console.log('\n🟡 PUBLICABLE pero con mejoras recomendadas');
  } else {
    console.log('\n🔴 NO PUBLICAR — Corregir errores primero');
  }

  console.log('═══════════════════════════════════════════════\n');
}

// ═══════════════════════════════════════════════
// TEST: Pegá tu noticia aquí y ejecutá el script
// ═══════════════════════════════════════════════

const TITULO_TEST = "Escribí el título de tu noticia aquí";
const CUERPO_TEST = `Escribí el cuerpo de tu noticia aquí. Este es un ejemplo de cómo usar el validador.

Pegá tu texto completo entre estos backticks, reemplazando este ejemplo.

Incluí párrafos reales con datos, fuentes, citas, etc.`;

// Ejecutar validación
validarNoticia(TITULO_TEST, CUERPO_TEST);

// También podés pasar por argumentos:
// node validar-antes-de-publicar.mjs "Tu título" "Tu cuerpo"
if (process.argv.length >= 4) {
  const tituloArg = process.argv[2];
  const cuerpoArg = process.argv[3];
  validarNoticia(tituloArg, cuerpoArg);
}
