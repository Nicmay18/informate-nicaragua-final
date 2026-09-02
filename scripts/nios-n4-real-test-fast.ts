import 'dotenv/config';
import { getAdminDb } from '../lib/firebase-admin';
import { proposeActionsFromOpportunities, approveAndExecuteAction } from '../lib/nios/action-engine';
import type { NiosGrowthOpportunity } from '../lib/nios/nios-growth-radar';

async function main() {
  console.log('[nios-n4-test] Cargando datos reales de Firestore...');
  const db = getAdminDb();

  const snap = await db.collection('noticias').orderBy('vistas', 'desc').limit(3).get();
  if (snap.empty) {
    console.log('[nios-n4-test] No hay noticias en Firestore.');
    return;
  }

  const articles = snap.docs.map((d) => d.data() as { slug: string; titulo?: string; vistas?: number; id?: string });
  console.log('[nios-n4-test] Artículos reales encontrados:', articles.map((a) => `${a.slug} (${a.vistas ?? 0} vistas)`).join(', '));

  const top = articles[0];
  const opportunity: NiosGrowthOpportunity = {
    kind: 'content-recirculation',
    title: `Recircular "${top.titulo || top.slug}"`,
    evidence: `${top.vistas ?? 0} vistas acumuladas en artículo real de Firestore.`,
    action: 'Preparar copias de redistribución para Telegram.',
    expectedResult: 'Recuperar tráfico de contenido probado.',
    confidence: 'Alta',
    impact: (top.vistas ?? 0) >= 1000 ? 'Alto' : 'Medio',
    target: top.slug,
    before: { slug: top.slug, titulo: top.titulo, vistas: top.vistas, articleId: top.id },
  };

  const actions = await proposeActionsFromOpportunities([opportunity]);
  const first = actions[0];

  console.log('[nios-n4-test] Acción propuesta:', first.title);
  console.log('[nios-n4-test] ID de acción:', first.id);

  const executed = await approveAndExecuteAction(first.id, 'nios-n4-test-fast');
  console.log('[nios-n4-test] Estado final:', executed.status);
  console.log('[nios-n4-test] Resultado:', JSON.stringify(executed.result, null, 2));
  console.log('[nios-n4-test] After:', JSON.stringify(executed.after, null, 2));
}

main().catch((err) => {
  console.error('[nios-n4-test] Error:', err);
  process.exit(1);
});
