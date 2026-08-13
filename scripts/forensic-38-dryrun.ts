/**
 * FASE 16-C — DRY-RUN de los 38 artículos restantes (post bug fix).
 * Genera propuesta concreta: para cada uno, causa de rechazo, acción propuesta,
 * fuentes sugeridas (genéricas pero verificables), riesgo, score esperado "desconocido".
 * NO escribe a Firestore.
 */
import * as fs from 'fs';
import * as path from 'path';
import admin from 'firebase-admin';
import { runMeniAsync } from '@/lib/meni';
import type { NoticiaInput } from '@/lib/meni';
import { sanitizeArticleHtml } from '@/lib/sanitize';

try {
  const e = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(e)) {
    for (const l of fs.readFileSync(e, 'utf8').split('\n')) {
      const l2 = l.replace(/\r$/, '');
      const m = l2.match(/^([A-Z_]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
    }
  }
} catch {}

const sa = {
  projectId: process.env.FIREBASE_PROJECT_ID!,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
  privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
};
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

function stripHtml(h: string): string {
  return (h || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}
function cw(t: string): number {
  return t.split(/\s+/).filter(Boolean).length;
}

function inferirAccion(score: number, blockingCodes: string[]): string {
  if (blockingCodes.includes('EDITORIAL_DNA_TRANSCRIPCION')) return 'REWRITE';
  if (score < 70) return 'ARCHIVE';
  if (score >= 86 && score < 90) return 'ENRICH';
  if (score >= 70 && score < 86) return 'ENRICH';
  return 'HUMAN_REVIEW';
}

function inferirRiesgo(accion: string): string {
  if (accion === 'ARCHIVE') return 'BAJO (se preserva el original)';
  if (accion === 'REWRITE') return 'ALTO (requiere reescritura editorial)';
  if (accion === 'ENRICH') return 'MEDIO';
  return 'BAJO-MEDIO';
}

function sugerirFuentes(titulo: string, _categoria: string, contenido: string): string[] {
  const t = (titulo + ' ' + contenido).toLowerCase();
  const fuentes: string[] = [];
  if (/managua|alcaldía|barrio|comuna/i.test(t)) fuentes.push('Alcaldía de Managua / ALMA');
  if (/policía|captur|deten|delito|juicio|fiscalía/i.test(t)) fuentes.push('Policía Nacional de Nicaragua', 'Fiscalía General de la República');
  if (/salud|hospital|minsa|enfermedad/i.test(t)) fuentes.push('Ministerio de Salud (MINSA)', 'Hospital Bertha Calderón / Hospital Alemán');
  if (/ineter|volcán|sismo|clima|lluvia/i.test(t)) fuentes.push('INETER (Instituto Nicaragüense de Estudios Territoriales)');
  if (/economía|remesa|exportación|importación|banco|dólar/i.test(t)) fuentes.push('Banco Central de Nicaragua', 'Banco Mundial datos Nicaragua');
  if (/deporte|futbol|mundial|olimpico|balonmano|beisbol/i.test(t)) fuentes.push('FIFA', 'CONCACAF', 'Federación Nicaragüense del deporte respectivo', 'El Nuevo Diario / La Prensa Deportes');
  if (/turismo|hotel|playa|volcán turismo|mirador/i.test(t)) fuentes.push('Instituto Nicaragüense de Turismo (INTUR)', 'Cámara de Turismo de Nicaragua (CANATUR)');
  if (/educación|universidad|mined|estudiante/i.test(t)) fuentes.push('Ministerio de Educación (MINED)', 'Universidad Nacional Autónoma de Nicaragua (UNAN)');
  if (/migración|extranjero|consulado|pasaporte/i.test(t)) fuentes.push('Dirección General de Migración y Extranjería', 'Consulados de Nicaragua en el exterior');
  if (fuentes.length === 0) fuentes.push('Institución oficial del área correspondiente', 'Prensa escrita nicaragüense verificable');
  return [...new Set(fuentes)];
}

function generarPropuesta(id: string, d: any, meni: any, accion: string): any {
  const titulo = d.titulo || '';
  const contenidoOriginal = sanitizeArticleHtml(typeof d.contenido === 'string' ? d.contenido : String(d.contenido || ''));
  const resumenOriginal = d.resumen || '';
  const score = meni.scoreFinal;
  const riesgo = inferirRiesgo(accion);
  const fuentes = sugerirFuentes(titulo, d.categoria, contenidoOriginal);

  // Determinar qué eje MENI pide
  const recomendaciones = meni.recomendaciones || [];
  const axes = recomendaciones.map((r: any) => r.area);
  const faltante = axes.includes('contexto') ? 'contexto' : axes.includes('explicación') ? 'explicación' : axes.includes('servicio') ? 'servicio' : 'valor periodístico';

  return {
    id,
    titulo,
    categoria: d.categoria,
    perfil: d.editorialTier,
    scoreMeni: score,
    aprobadoMeni: meni.aprobado,
    calificacion: meni.calificacion,
    blockingIssues: meni.blockingIssues,
    recomendaciones,
    accionPropuesta: accion,
    riesgo,
    ejeFaltante: faltante,
    fuentesSugeridas: fuentes,
    scoreEsperado: 'DESCONOCIDO_HASTA_EJECUTAR',
    antes: {
      resumenOriginal,
      contenidoResumen: stripHtml(contenidoOriginal).slice(0, 200),
      palabras: cw(stripHtml(contenidoOriginal)),
    },
    propuesta: {
      resumen: null,
      contenidoAgregar: `Agregar ${faltante} verificable usando las fuentes sugeridas. No inventar cifras, nombres ni fechas.`,
      estructura: accion === 'REWRITE' ? 'Reescribir párrafo por párrafo aportando análisis propio' : 'Ampliar la nota con 1-3 párrafos de contexto y explicación',
    },
    notas: 'Score esperado desconocido. Se re-evaluará con MENI tras la modificación.',
  };
}

async function main() {
  console.log('=== FASE 16-C: DRY-RUN 38 ARTÍCULOS RESTANTES ===\n');

  // IDs de los 38 restantes
  const phase18Log = JSON.parse(fs.readFileSync('FORENSIC_PHASE18_EXECUTION.json', 'utf8'));
  const ids = phase18Log.bloquearIds.filter((id: string) => id !== '1HmobwfngxeXoUofqosD');
  console.log(`Generando dry-run para ${ids.length} artículos...\n`);

  const propuestas: any[] = [];
  const resumenStats = { ENRICH: 0, REWRITE: 0, ARCHIVE: 0, HUMAN_REVIEW: 0 };

  for (const id of ids) {
    try {
      const snap = await db.collection('noticias').doc(id).get();
      if (!snap.exists) continue;
      const d = snap.data()!;
      const contenido = sanitizeArticleHtml(typeof d.contenido === 'string' ? d.contenido : String(d.contenido || ''));

      const input: NoticiaInput = {
        id,
        titulo: d.titulo || '',
        contenido,
        resumen: d.resumen || '',
        categoria: d.categoria || 'General',
        autor: d.autor || '',
        fecha: d.fecha?.toDate ? d.fecha.toDate().toISOString() : new Date().toISOString(),
        imagen: d.imagen || undefined,
        slug: d.slug || id,
      };

      const meni = await runMeniAsync(input, { db, skipEditorBrain: true });
      const accion = inferirAccion(meni.scoreFinal ?? 0, (meni.blockingIssues || []).map((b: any) => b.code));
      resumenStats[accion as keyof typeof resumenStats]++;

      const p = generarPropuesta(id, d, meni, accion);
      propuestas.push(p);
      console.log(`  ${id} | ${meni.scoreFinal} | ${accion} | ${p.riesgo} | ${d.titulo?.slice(0,50)}`);
    } catch (e: any) {
      console.error(`  ERROR ${id}: ${e.message?.slice(0, 80)}`);
    }
  }

  // JSON
  const jsonOut = {
    timestamp: new Date().toISOString(),
    total: propuestas.length,
    resumenStats,
    propuestas,
  };
  fs.writeFileSync('FORENSIC_38_DRYRUN.json', JSON.stringify(jsonOut, null, 2));

  // Markdown
  let md = '# DRY-RUN: 38 artículos restantes\n\n';
  md += `**Fecha:** ${new Date().toISOString()}\n\n`;
  md += '## ADVERTENCIA CRÍTICA\n\n';
  md += 'Este documento es un DRY-RUN. **NO se ha escrito nada a Firestore.** Ningún score esperado ha sido fabricado.\n\n';
  md += '## Resumen\n\n';
  md += `| Acción | Cantidad |\n|---|---|\n`;
  for (const [k, v] of Object.entries(resumenStats)) md += `| ${k} | ${v} |\n`;
  md += '\n';

  for (const p of propuestas) {
    md += `---\n\n## ${p.id} — ${p.titulo}\n\n`;
    md += `| Campo | Valor |\n|---|---|\n`;
    md += `| Categoría | ${p.categoria} |\n`;
    md += `| Perfil | ${p.perfil} |\n`;
    md += `| Score MENI actual | ${p.scoreMeni} |\n`;
    md += `| Calificación | ${p.calificacion} |\n`;
    md += `| Acción propuesta | **${p.accionPropuesta}** |\n`;
    md += `| Riesgo | ${p.riesgo} |\n`;
    md += `| Eje faltante | ${p.ejeFaltante} |\n`;
    md += `\n### Blocking issues\n\n`;
    for (const b of p.blockingIssues) {
      md += `- **${b.code}** — ${b.description}\n`;
    }
    md += `\n### Recomendaciones MENI\n\n`;
    for (const r of p.recomendaciones) {
      md += `- [${r.area}] ${r.mensaje}\n`;
    }
    md += `\n### Fuentes sugeridas (verificar antes de usar)\n\n`;
    for (const f of p.fuentesSugeridas) md += `- ${f}\n`;
    md += `\n### Propuesta editorial\n\n`;
    md += `${p.propuesta.contenidoAgregar}\n\n`;
    md += `**Score esperado:** ${p.scoreEsperado}\n\n`;
    md += `**Notas:** ${p.notas}\n\n`;
  }

  fs.writeFileSync('FORENSIC_38_DRYRUN.md', md);
  console.log(`\n✓ FORENSIC_38_DRYRUN.json`);
  console.log(`✓ FORENSIC_38_DRYRUN.md`);
  console.log(`\nResumen:`, JSON.stringify(resumenStats, null, 2));

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
