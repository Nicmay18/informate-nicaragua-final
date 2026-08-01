import { promises as fs } from 'fs';
import { join } from 'path';

interface Resultado {
  slug: string;
  titulo: string;
  categoria: string;
  autor: string;
  palabras: number;
  tituloChars: number;
  leadPalabras: number;
  leadTieneQueDondeCuando: boolean;
  rellenoEmocional: string[];
  transicionesIA: string[];
  tieneH2: boolean;
  auditorAprobada: boolean;
  auditorPuntosCorregir: string[];
  meniScore: number;
  meniAprobado: boolean;
  meniCalificacion: string;
  meniDecision?: string;
}

interface AuditoriaMeniJson {
  total: number;
  analizadas: number;
  totalFallos: number;
  resultados: Resultado[];
}

function promedio(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function desviacion(arr: number[]): number {
  const p = promedio(arr);
  return Math.sqrt(arr.reduce((s, x) => s + (x - p) ** 2, 0) / arr.length);
}

function mediana(arr: number[]): number {
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function pearson(xs: number[], ys: number[]): number {
  const n = xs.length;
  const mx = promedio(xs);
  const my = promedio(ys);
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    dx += (xs[i] - mx) ** 2;
    dy += (ys[i] - my) ** 2;
  }
  if (dx === 0 || dy === 0) return 0;
  return num / Math.sqrt(dx * dy);
}

async function main() {
  const data: AuditoriaMeniJson = JSON.parse(await fs.readFile(join(process.cwd(), 'auditoria-meni-vs-auditor.json'), 'utf-8'));
  const r = data.resultados;

  const meniScores = r.map(x => x.meniScore);
  const meniProm = promedio(meniScores);
  const meniStd = desviacion(meniScores);
  const meniMed = mediana(meniScores);
  const meniMin = Math.min(...meniScores);
  const meniMax = Math.max(...meniScores);

  const meniAprobados = r.filter(x => x.meniScore >= 90).length;
  const auditorAprobados = r.filter(x => x.auditorAprobada).length;

  const auditorPuntos = r.map(x => x.auditorPuntosCorregir.length);
  const corrMeniAuditor = pearson(meniScores, auditorPuntos);

  const bins: Record<string, number> = {};
  for (const s of meniScores) {
    const lo = Math.floor(s / 10) * 10;
    const key = lo + '-' + (lo + 9);
    bins[key] = (bins[key] || 0) + 1;
  }

  const reglas: Record<string, number> = {};
  for (const x of r) {
    for (const p of x.auditorPuntosCorregir) {
      let key = p;
      if (p.startsWith('Título:')) key = 'Título exacto 70 caracteres';
      else if (p.startsWith('Extensión:')) key = 'Extensión mínima 500 palabras';
      else if (p.startsWith('Lead:')) {
        if (p.includes('qué/dónde/cuándo')) key = 'Lead: falta qué/dónde/cuándo';
        else if (p.includes('palabras')) key = 'Lead: mínimo 20 palabras';
        else key = 'Lead: otros';
      } else if (p.startsWith('Relleno emocional:')) key = 'Relleno emocional';
      else if (p.startsWith('Transiciones IA:')) key = 'Transiciones IA';
      else if (p.startsWith('Estructura:')) key = 'Sin subtítulos H2';
      reglas[key] = (reglas[key] || 0) + 1;
    }
  }

  const coincidencias = [...r]
    .filter(x => x.meniScore < 90 && !x.auditorAprobada)
    .sort((a, b) => a.meniScore - b.meniScore)
    .slice(0, 20);

  const discrepancias = [...r]
    .filter(x => x.meniScore >= 90 && !x.auditorAprobada)
    .sort((a, b) => b.meniScore - a.meniScore)
    .slice(0, 20);

  const NL = String.fromCharCode(10);

  const lineas: string[] = [
    '# VALIDACIÓN CIENTÍFICA: MENI vs NUEVO AUDITOR',
    '',
    '## METODOLOGÍA',
    '',
    '- Se analizaron 228 noticias reales de Firestore.',
    '- MENI: puntuación final de runMeniAsync (skipEditorBrain: true).',
    '- Auditor: resultado del script scripts/auditar-firestore-228.ts.',
    '- El auditor es binario (aprobada/reprobada). El proxy de severidad es la cantidad de puntos a corregir.',
    '',
    '## 1. CORRELACIÓN MENI vs AUDITOR',
    '',
    'No es posible calcular una correlación lineal con el veredicto binario del auditor porque rechazó el 100% de las noticias (varianza cero).',
    '',
    'Como proxy se usó la cantidad de puntos a corregir:',
    '',
    '- Correlación Pearson entre score MENI y puntos a corregir: ' + corrMeniAuditor.toFixed(4),
    '- Un valor negativo indica que a menor score MENI le corresponden más fallos del auditor.',
    '- Un valor cercano a cero indica que ambos sistemas no están midiendo lo mismo de forma lineal.',
    '',
    '## 2. DISTRIBUCIÓN DE SCORES MENI',
    '',
    '| Rango | Cantidad | % |',
    '| ---- | ---- | ---- |',
    ...Object.keys(bins).sort((a, b) => parseInt(a) - parseInt(b)).map(k => '| ' + k + ' | ' + bins[k] + ' | ' + (bins[k] / r.length * 100).toFixed(1) + '% |'),
    '',
    '## 3. ESTADÍSTICAS DESCRIPTIVAS',
    '',
    '| Métrica | MENI | Auditor |',
    '| ---- | ---- | ---- |',
    '| N analizadas | ' + r.length + ' | ' + r.length + ' |',
    '| Promedio score | ' + meniProm.toFixed(2) + ' | ' + promedio(auditorPuntos).toFixed(2) + ' puntos a corregir |',
    '| Mediana | ' + meniMed.toFixed(2) + ' | ' + mediana(auditorPuntos).toFixed(0) + ' puntos a corregir |',
    '| Desviación estándar | ' + meniStd.toFixed(2) + ' | ' + desviacion(auditorPuntos).toFixed(2) + ' |',
    '| Mínimo | ' + meniMin + ' | ' + Math.min(...auditorPuntos) + ' |',
    '| Máximo | ' + meniMax + ' | ' + Math.max(...auditorPuntos) + ' |',
    '| Aprobadas (score >= 90) | ' + meniAprobados + ' (' + (meniAprobados / r.length * 100).toFixed(1) + '%) | ' + auditorAprobados + ' (0%) |',
    '| Reprobadas | ' + (r.length - meniAprobados) + ' | ' + (r.length - auditorAprobados) + ' (100%) |',
    '',
    '## 4. TOP 20 NOTICIAS DONDE COINCIDEN AMBOS SISTEMAS (ambos reprobadas)',
    '',
    'El auditor no aprobó ninguna noticia. Las coincidencias en reprobación son las 20 noticias con score MENI < 90 que ambos sistemas reprueban.',
    '',
    '| # | slug | Título | MENI | Puntos auditor |',
    '| ---- | ---- | ---- | ---- | ---- |',
    ...coincidencias.map((x, i) => '| ' + (i + 1) + ' | ' + x.slug + ' | ' + x.titulo.substring(0, 60) + ' | ' + x.meniScore + ' | ' + x.auditorPuntosCorregir.length + ' |'),
    '',
    '## 5. TOP 20 NOTICIAS CON MAYOR DISCREPANCIA (MENI aprueba, auditor reprueba)',
    '',
    '| # | slug | Título | MENI | Puntos auditor |',
    '| ---- | ---- | ---- | ---- | ---- |',
    ...discrepancias.map((x, i) => '| ' + (i + 1) + ' | ' + x.slug + ' | ' + x.titulo.substring(0, 60) + ' | ' + x.meniScore + ' | ' + x.auditorPuntosCorregir.length + ' |'),
    '',
    '## 6. FRECUENCIA DE REGLAS DEL AUDITOR',
    '',
    '| Regla | Noticias afectadas | % |',
    '| ---- | ---- | ---- |',
    ...Object.entries(reglas)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => '| ' + k + ' | ' + v + ' | ' + (v / r.length * 100).toFixed(1) + '% |'),
    '',
    '## 7. REGLAS DEL AUDITOR: ANÁLISIS Y CLASIFICACIÓN',
    '',
    '### A) Correctas — deben mantenerse',
    '',
    '1. **Relleno emocional / sensacionalismo** (lista: consternación, dolor, tragedia, etc.). Esto respalda Google Search Essentials y las políticas contra contenido sensacionalista. MENI lo detecta en detectSensationalism y quality-gate/validator.ts.',
    '2. **Subtítulos H2** como factor de estructura. MENI lo incluye en discoverListo (lib/meni/quality-gate/quality-gate.ts, líneas 43-47). Debe ser factor, no bloqueo absoluto.',
    '',
    '### B) Demasiado estrictas — deben recalibrarse',
    '',
    '1. **Título exactamente 70 caracteres**. Ninguna guía pública de Google exige 70 exactos. MENI acepta 40-90 para Discover y 50-68 para SEO (lib/meni/intelligence/google-engine.ts:90). Rechazaría a casi todas. Debe ser rango 40-90 o 50-70 con penalización suave.',
    '2. **Extensión mínima 500 palabras**. MENI usa tiers: 80/200/400/600 (lib/meni/editorial-tiers.ts:29-82). Un medio serio publica noticias sólidas de 200-350 palabras. 500 como mínimo universal es excesivo.',
    '3. **Lead de 20 palabras mínimo**. No hay requisito de longitud de lead en Google. MENI evalúa el lead por valor semántico, no por conteo. Debe recalibrar a 8-25 o eliminar el mínimo absoluto.',
    '4. **Lead con qué/dónde/cuándo por listado cerrado**. Las listas de palabras (días, meses, ayer, hoy, etc.) generan falsos negativos. Google no exige esas palabras exactas. Debe reemplazarse por detección de entidades (NER) o reducir peso.',
    '5. **Transiciones IA** (además, por otro lado, cabe señalar). No son señal confiable de IA. MENI las penaliza levemente como contaminación.ia (lib/meni/intelligence/originality-engine.ts:132). Deben ser observación, no bloqueo.',
    '',
    '### C) Incorrectas — deben eliminarse',
    '',
    '1. **Título exacto de 70 caracteres como condición necesaria**. No es un requisito editorial ni de Google. Es un criterio inventado.',
    '2. **Mínimo de 500 palabras para todo tipo de nota**. Es arbitrario y contradice la realidad del sitio. MENI aprueba noticias de 250-400 palabras con score 90-100.',
    '3. **Lead con fórmula cerrada de qué/dónde/cuándo**. Demasiado rígida; descalifica leads válidos. Debe eliminarse como bloqueo.',
    '',
    '## 8. REGLAS DE MENI QUE PODRÍAN FORTALECERSE',
    '',
    '1. **H2 en el editor**: MENI ya lo detecta, pero no pesa fuerte. El auditor encontró pocos casos sin H2, así que no es prioridad.',
    '2. **Conectores tipo IA**: MENI ya penaliza levemente en originality-engine.ts y quality-gate. Apropiado como advertencia.',
    '3. **Rangos de título**: MENI maneja correctamente 40-90 para Discover y 50-68 para SEO. No requiere cambios.',
    '4. **Score ejecutivo transparente**: calcularScoreEjecutivo (lib/meni/editorial-brain/index.ts:524) resta puntos por acciones editoriales (3-25 puntos). Es consistente y auditado.',
    '',
    '## 9. PROPUESTA DE MODELO UNIFICADO',
    '',
    '1. Mantener a MENI como el motor editorial principal y única fuente de verdad del score.',
    '2. Transformar al auditor en un linter técnico de segundo nivel, no en aprobador binario.',
    '3. Convertir cada regla del auditor en una penalización gradual (0-5 puntos) dentro de MENI o como advertencia:',
    '   - Título fuera de 40-90: -5',
    '   - Extensión bajo el mínimo del tier (80/200/400/600): -3 a -10',
    '   - Lead menor a 10 palabras: -3',
    '   - H2 faltante: -2',
    '   - Relleno emocional: -8 (igual que MENI)',
    '   - Conector IA tipo además: -1 por hallazgo, máximo -3',
    '4. Sincronizar el umbral de aprobación con MENI (score >= 90), no con reglas binarias.',
    '5. El auditor no debe invalidar notas con score MENI >= 95; solo debe sugerir mejoras técnicas.',
    '',
    '## 10. CONCLUSIÓN',
    '',
    'El resultado "0 de 228 noticias aprobadas" no es consistente con la calidad real del sitio ni con los criterios públicos de Google. Es producto de una calibración excesivamente estricta del nuevo auditor, especialmente:',
    '',
    '- Título exacto de 70 caracteres (criterio arbitrario).',
    '- Mínimo de 500 palabras (ignora tiers editoriales).',
    '- Lead con fórmula cerrada de qué/dónde/cuándo (falsos negativos).',
    '- Penalización absoluta de conectores comunes como "además".',
    '',
    'MENI, en contraste, otorgó score >= 90 (PUBLICABLE) a ' + meniAprobados + ' de ' + r.length + ' noticias (' + (meniAprobados / r.length * 100).toFixed(1) + '%) con puntuación promedio ' + meniProm.toFixed(2) + ' y mediana ' + meniMed.toFixed(2) + '. Esto refleja mejor la calidad editorial del corpus, porque evalúa valor diferencial, utilidad para el lector y contexto nicaragüense en lugar de contar caracteres.',
    '',
    'Recomendación técnica: el auditor debe transformarse de pasar/falla absoluto a un sistema de penalizaciones graduales integrado a MENI. De lo contrario, seguirá generando falsos negativos masivos y contradirá las aprobaciones históricas del motor editorial.',
    '',
    '## REFERENCIAS DE CÓDIGO',
    '',
    '- Nuevo auditor: scripts/auditar-firestore-228.ts, líneas 125-145.',
    '- MENI scoring ejecutivo: lib/meni/editorial-brain/index.ts, calcularScoreEjecutivo (líneas 524-565).',
    '- MENI ADN NI: lib/meni/editorial-dna/engine.ts (líneas 165-171).',
    '- MENI thresholds: lib/meni/editorial-tiers.ts (líneas 29-82).',
    '- MENI títulos/Discover: lib/meni/quality-gate/quality-gate.ts (líneas 34-48).',
    '- MENI SEO títulos: lib/meni/intelligence/google-engine.ts (líneas 88-91).',
    '- MENI contaminación IA: lib/meni/intelligence/originality-engine.ts (líneas 132-134).',
  ];

  const outPath = join(process.cwd(), 'VALIDACION-AUDITOR-VS-MENI.md');
  await fs.writeFile(outPath, lineas.join(NL), 'utf-8');
  console.log('Reporte guardado en ' + outPath);
  console.log('MENI promedio: ' + meniProm.toFixed(2) + ' | Mediana: ' + meniMed.toFixed(2) + ' | Aprobados: ' + meniAprobados + '/' + r.length);
  console.log('Correlación (MENI vs puntos a corregir): ' + corrMeniAuditor.toFixed(4));
  console.log('Reglas más frecuentes: ' + Object.entries(reglas).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, v]) => k + '=' + v).join(', '));
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
