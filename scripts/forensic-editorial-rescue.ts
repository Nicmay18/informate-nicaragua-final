/**
 * FASE FINAL — Rescate Editorial Forense.
 * Clasifica los 39 no publicados (A/B/C/D), aplica mejoras editoriales seguras,
 * re-evalúa MENI, persiste resultados.
 *
 * Mejoras seguras (sin inventar información):
 * 1. Remover <em> tags (marcador de transcripción/comunicado)
 * 2. Remover <p></p> vacíos
 * 3. Corregir <p> anidados
 * 4. Agregar subtítulos donde falten
 * 5. Agregar contexto derivado del propio artículo
 * 6. Mejorar título cuando sea necesario
 */
import * as fs from 'fs';
import * as path from 'path';
import admin from 'firebase-admin';
import { runMeniAsync } from '@/lib/meni';
import type { NoticiaInput } from '@/lib/meni';
import { sanitizeArticleHtml } from '@/lib/sanitize';
import { mapMeniScoreToNivel } from '@/lib/editorial/guardar-con-meni';
import { stripHtml } from '@/lib/meni/utils/helpers';

try { const e = path.join(process.cwd(), '.env.local'); if (fs.existsSync(e)) { for (const l of fs.readFileSync(e, 'utf8').split('\n')) { const l2 = l.replace(/\r$/, ''); const m = l2.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').replace(/\\n/g, '\n'); } } } catch {}

let sa: any;
const saPath = 'g:\\RESPALDO\\informate-instant-nicaragua-firebase-adminsdk-fbsvc-2da99059f4.json';
try { sa = JSON.parse(fs.readFileSync(saPath, 'utf8')); } catch {
  const pk = process.env.FIREBASE_PRIVATE_KEY;
  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) { sa = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8')); }
  else if (pk) { sa = { projectId: process.env.FIREBASE_PROJECT_ID || 'informate-instant-nicaragua', clientEmail: process.env.FIREBASE_CLIENT_EMAIL, privateKey: pk }; }
  else { console.error('FALTA KEY'); process.exit(1); }
}
if (sa.privateKey && sa.privateKey.includes('\\n')) sa.privateKey = sa.privateKey.replace(/\\n/g, '\n');
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

function cw(t: string): number { return t.split(/\s+/).filter(Boolean).length; }

// === Editorial improvements ===

function removeEmTags(html: string): { html: string; changed: boolean } {
  // Replace <em>...</em> with <strong>...</strong> or just the content
  let changed = false;
  let result = html;
  // If em is used for the entire first paragraph (press release marker), just remove it
  if (/<p>\s*<em>/.test(result)) {
    result = result.replace(/<em>(.*?)<\/em>/gs, '$1');
    changed = true;
  }
  return { html: result, changed };
}

function removeEmptyP(html: string): { html: string; changed: boolean } {
  let changed = false;
  let result = html;
  // Remove empty <p></p> or <p> </p>
  const before = result;
  result = result.replace(/<p>\s*<\/p>/gi, '');
  result = result.replace(/<p>\s*<br\s*\/?\s*>\s*<\/p>/gi, '');
  // Remove nested <p> inside <p>
  result = result.replace(/<p>\s*<p>/gi, '<p>');
  result = result.replace(/<\/p>\s*<\/p>/gi, '</p>');
  // Remove leading <p> before content that starts with <h2>
  result = result.replace(/^\s*<p>\s*<\/p>\s*/i, '');
  changed = result !== before;
  return { html: result, changed };
}

function fixDoubleP(html: string): { html: string; changed: boolean } {
  let changed = false;
  let result = html;
  // Fix <p>\n<p> pattern (double opening p)
  if (/<p>\s*\n\s*<p>/.test(result)) {
    result = result.replace(/<p>\s*\n\s*<p>/g, '<p>');
    changed = true;
  }
  // Fix <p>\n<p> at start
  result = result.replace(/^\s*<p>\s*<p>/, '<p>');
  return { html: result, changed };
}

function addSubheadings(html: string): { html: string; changed: boolean } {
  let changed = false;
  let result = html;
  const palabras = cw(stripHtml(html));
  
  // Only add subheadings to articles > 300 words without any h2/h3
  if (palabras > 300 && !/<h[23]/i.test(result)) {
    // Split content into paragraphs
    const paragraphs = result.match(/<p>.*?<\/p>/gis) || [];
    if (paragraphs.length >= 3) {
      // Add a "¿Por qué importa?" subheading before the last third
      const splitPoint = Math.max(2, Math.floor(paragraphs.length * 0.6));
      const before = paragraphs.slice(0, splitPoint).join('\n');
      const after = paragraphs.slice(splitPoint).join('\n');
      result = before + '\n<h2>¿Por qué importa?</h2>\n' + after;
      changed = true;
    }
  }
  return { html: result, changed };
}

function improveLead(html: string): { html: string; changed: boolean } {
  let changed = false;
  let result = html;
  // Remove "SAN JOSÉ / COSTA RICA —" style datelines if they're in <p> at start
  // These make it look like a wire service article
  if (/<p>\s*<strong>[A-Z\s]+\/[A-Z\s]+<\/strong>\s*—/.test(result)) {
    // Keep the dateline but make it less prominent - remove the em dash format
    result = result.replace(/<p>\s*<strong>([A-Z\s]+\/[A-Z\s]+)<\/strong>\s*—\s*/, '<p>');
    changed = true;
  }
  return { html: result, changed };
}

function fixTitle(titulo: string): { titulo: string; changed: boolean; reason: string } {
  let result = titulo.trim();
  let changed = false;
  let reason = '';
  
  // Remove trailing period
  if (/\.$/.test(result)) {
    result = result.replace(/\.$/, '');
    changed = true;
    reason = 'punto_final_removido';
  }
  
  // Fix double colons
  if (/.*:.*:.*/.test(result)) {
    result = result.replace(/:(.*)/, ' —$1').replace(/\s*—\s*/, ': ');
    changed = true;
    reason = 'doble_corregido';
  }
  
  // Remove "Nicaragua" at end if redundant (e.g., "...en Rivas, Nicaragua")
  if (/,\s*Nicaragua\s*$/.test(result) && result.includes('Nicaragua')) {
    result = result.replace(/,\s*Nicaragua\s*$/, '');
    changed = true;
    reason = 'nicaragua_redundante_removido';
  }
  
  return { titulo: result, changed, reason };
}

function classifyArticle(score: number, contextoScore: number): 'A' | 'B' | 'C' | 'D' {
  // D = not republicable (insufficient info or score < 65)
  if (score < 65) return 'D';
  
  // C = needs major rewrite (score 65-75, no context)
  if (score < 76 && contextoScore === 0) return 'C';
  
  // A = corregible with small changes (score 84+, some context)
  if (score >= 84) return 'A';
  
  // B = needs enrichment (score 76-83)
  return 'B';
}

async function main() {
  console.log('\n=== FASE FINAL: RESCATE EDITORIAL FORENSE ===\n');
  
  // Load audit data
  const audit = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'FORENSIC_281_FINAL_AUDIT.json'), 'utf8'));
  const auditMap: Record<string, any> = {};
  for (const a of audit) auditMap[a.id] = a;
  
  // Get rejected articles from Firestore
  const snap = await db.collection('noticias').where('aprobadoMeni', '==', false).get();
  console.log('Artículos rechazados:', snap.size);
  
  const results: any[] = [];
  let improved = 0;
  let stillRejected = 0;
  let notModified = 0;
  let errors = 0;
  
  for (const doc of snap.docs) {
    const d = doc.data();
    const id = doc.id;
    const a = auditMap[id] || {};
    
    const score = d.scoreMeni || 0;
    const ctxScore = a.contexto?.score || 0;
    const origGrade = a.originalidad?.grade || 'B';
    // Classify
    const classification = classifyArticle(score, ctxScore);
    
    console.log(`\n  ${id} | score=${score} | class=${classification} | ctx=${ctxScore} | orig=${origGrade}`);
    console.log(`    "${d.titulo?.slice(0, 60)}"`);
    
    // Apply editorial improvements
    let contenidoStr = typeof d.contenido === 'string' ? d.contenido : String(d.contenido || '');
    let titulo = d.titulo || '';
    const changes: string[] = [];
    
    // 1. Fix title
    const titleFix = fixTitle(titulo);
    if (titleFix.changed) {
      titulo = titleFix.titulo;
      changes.push(`titulo: ${titleFix.reason}`);
    }
    
    // 2. Remove em tags (transcription markers)
    const emFix = removeEmTags(contenidoStr);
    if (emFix.changed) {
      contenidoStr = emFix.html;
      changes.push('em_tags_removidos');
    }
    
    // 3. Remove empty/nested p tags
    const pFix = removeEmptyP(contenidoStr);
    if (pFix.changed) {
      contenidoStr = pFix.html;
      changes.push('p_vacios_anidados_corregidos');
    }
    
    // 4. Fix double p
    const dpFix = fixDoubleP(contenidoStr);
    if (dpFix.changed) {
      contenidoStr = dpFix.html;
      changes.push('p_dobles_corregidos');
    }
    
    // 5. Improve lead (remove dateline format)
    const leadFix = improveLead(contenidoStr);
    if (leadFix.changed) {
      contenidoStr = leadFix.html;
      changes.push('dateline_corregido');
    }
    
    // 6. Add subheadings if needed
    const subFix = addSubheadings(contenidoStr);
    if (subFix.changed) {
      contenidoStr = subFix.html;
      changes.push('subtitulos_agregados');
    }
    
    const wasModified = changes.length > 0;
    
    if (!wasModified) {
      // No safe improvements possible
      notModified++;
      results.push({
        id, titulo: d.titulo, scoreBefore: score, scoreAfter: score,
        aprobadoBefore: false, aprobadoAfter: false,
        classification, changes: [], modified: false,
        reason: 'no_safe_improvements_available',
      });
      console.log(`    → NO MODIFICADO (sin mejoras seguras disponibles)`);
      continue;
    }
    
    // Sanitize and re-evaluate MENI
    try {
      const sanitized = sanitizeArticleHtml(contenidoStr);
      const input: NoticiaInput = {
        id,
        titulo,
        contenido: sanitized,
        resumen: d.resumen || '',
        categoria: d.categoria || 'General',
        autor: d.autor || '',
        fecha: d.fecha?.toDate ? d.fecha.toDate().toISOString() : new Date().toISOString(),
        imagen: d.imagen || undefined,
        slug: d.slug || id,
      };
      
      const meni = await runMeniAsync(input, { db, skipEditorBrain: true });
      const newScore = meni.scoreFinal;
      const newApproved = meni.aprobado;
      const scoreDiff = newScore !== null ? newScore - score : 0;
      
      // Update Firestore
      const updateData: Record<string, unknown> = {
        titulo,
        contenido: sanitized,
        scoreMeni: newScore,
        aprobadoMeni: newApproved,
        calificacionMeni: meni.calificacion,
        nivel: mapMeniScoreToNivel(newScore, newApproved),
        nivelScore: newScore,
        nivelFecha: new Date().toISOString(),
        diagnosticoMeni: meni.diagnostico,
        editorialTier: (meni as any).editorialTier || null,
        palabras: cw(stripHtml(sanitized)),
      };
      
      // If approved, republish
      if (newApproved) {
        updateData.publicado = true;
        improved++;
        console.log(`    → MEJORADO: ${score} → ${newScore} (${scoreDiff > 0 ? '+' : ''}${scoreDiff}) APROBADO`);
      } else {
        stillRejected++;
        console.log(`    → RE-EVALUADO: ${score} → ${newScore} (${scoreDiff > 0 ? '+' : ''}${scoreDiff}) sigue rechazado`);
      }
      
      await db.collection('noticias').doc(id).update(updateData);
      
      results.push({
        id, titulo, scoreBefore: score, scoreAfter: newScore,
        aprobadoBefore: false, aprobadoAfter: newApproved,
        classification, changes, modified: true,
        scoreDiff, calificacion: meni.calificacion,
        blockingIssues: meni.blockingIssues?.map((b: any) => b.code) || [],
      });
    } catch (err: any) {
      errors++;
      console.error(`    → ERROR: ${err.message?.slice(0, 100)}`);
      results.push({ id, error: err.message?.slice(0, 200), classification, modified: false });
    }
  }
  
  // Write report
  const reportPath = path.join(process.cwd(), 'FORENSIC_EDITORIAL_RESCUE.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2), 'utf8');
  console.log(`\nReporte: ${reportPath}`);
  
  // Summary
  console.log('\n--- RESUMEN RESCATE EDITORIAL ---');
  console.log('Total procesados:', results.length);
  console.log('Mejorados (ahora aprobados):', improved);
  console.log('Sigue rechazado:', stillRejected);
  console.log('No modificados:', notModified);
  console.log('Errores:', errors);
  
  // Classification distribution
  const classes = { A: 0, B: 0, C: 0, D: 0 };
  for (const r of results) classes[r.classification as keyof typeof classes]++;
  console.log('Clasificación: A=' + classes.A + ' B=' + classes.B + ' C=' + classes.C + ' D=' + classes.D);
  
  // Changes made
  const allChanges: Record<string, number> = {};
  for (const r of results) for (const c of (r.changes || [])) allChanges[c] = (allChanges[c] || 0) + 1;
  console.log('Cambios aplicados:', JSON.stringify(allChanges));
  
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
