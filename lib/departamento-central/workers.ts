import { getAdminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { executeOperationalRepair } from '@/lib/nios/operational-loop';
import { runMeni } from '@/lib/meni';
import type { NoticiaInput } from '@/lib/meni';
import { runEditorialDiagnosis } from '@/lib/nios/editorial-diagnosis';
import { checkUrl, handleSiteHealth } from './health';
import { recordLearning } from './learning';
import { completeJob, failJob } from './queue';
import { runDepartamentoCentralCycle } from './cycle';
import { saveDepartamentoReport } from './store';
import { writeHeartbeat } from './heartbeat';
import type { DeptoHeartbeat, DeptoJob, DeptoJobType } from './types';

const MAX_ARTICLE_AGE_MS = 24 * 60 * 60 * 1000;

async function healthCheckWorker(job: DeptoJob): Promise<void> {
  const started = Date.now();
  const [root, noticias] = await Promise.all([
    checkUrl('/'),
    checkUrl('/noticias/'),
  ]);
  const handled = await handleSiteHealth(root, noticias);

  await recordLearning({
    source: 'departamento-central',
    kind: 'learning',
    note: `Heartbeat de salud: root=${root.status} /noticias=${noticias.status} → ${handled.status}.`,
    tags: ['disponibilidad', 'heartbeat', '24x7'],
  });

  await writeHeartbeat('health-check', handled.status === 'ok' ? 'healthy' : 'down', {
    durationMs: Date.now() - started,
  });

  await completeJob(job.jobId, {
    root,
    noticias,
    status: handled.status,
    items: handled.items,
  });
}

async function dailyReportWorker(job: DeptoJob): Promise<void> {
  const started = Date.now();
  const report = await runDepartamentoCentralCycle();
  await saveDepartamentoReport(report);

  await writeHeartbeat('daily-report', 'healthy', {
    durationMs: Date.now() - started,
  });

  await recordLearning({
    source: 'departamento-central',
    kind: 'learning',
    note: `Reporte diario generado: ${report.summary.replace(/\n/g, ' ')}`,
    tags: ['reporte', 'daily', '24x7'],
  });

  await completeJob(job.jobId, { date: report.date, siteStatus: report.site.status });
}

async function articlePipelineWorker(job: DeptoJob): Promise<void> {
  const db = getAdminDb();
  const articleId = String(job.payload?.articleId || '');
  if (!articleId) throw new Error('articleId no definido');

  const snap = await db.collection('noticias').doc(articleId).get();
  if (!snap.exists) throw new Error(`Noticia ${articleId} no encontrada`);

  const data = snap.data();
  const noticia: NoticiaInput = {
    id: articleId,
    titulo: String(data?.titulo ?? data?.title ?? ''),
    resumen: String(data?.resumen ?? data?.excerpt ?? data?.bajada ?? ''),
    contenido: String(data?.contenido ?? data?.body ?? data?.article ?? ''),
    categoria: String(data?.categoria ?? data?.category ?? 'General'),
    autor: String(data?.autor ?? data?.author ?? ''),
    fecha: String(data?.fecha ?? data?.createdAt ?? data?.publishedAt ?? new Date().toISOString()),
    slug: String(data?.slug ?? data?.id ?? articleId),
    keywords: Array.isArray(data?.keywords) ? data?.keywords : (typeof data?.keywords === 'string' ? (data?.keywords as string).split(',').map((s: string) => s.trim()).filter(Boolean) : []),
  };

  const result = runMeni(noticia);
  const diagnosis = runEditorialDiagnosis(noticia, result);

  await db.collection('meni_diagnosis').add({
    articleId,
    noticia: {
      titulo: noticia.titulo,
      categoria: noticia.categoria,
    },
    result,
    diagnosis,
    timestamp: new Date().toISOString(),
    origin: 'departamento-central',
  });

  if (diagnosis.publicationReadiness !== 'READY') {
    await recordLearning({
      source: 'departamento-central',
      kind: 'learning',
      note: `Artículo ${articleId} requiere atención: ${diagnosis.publicationReadiness} con ${diagnosis.problems.length} problemas.`,
      tags: ['editorial', 'meni', 'artículo', '24x7'],
    });
  }

  await writeHeartbeat('article-pipeline', 'healthy');
  await completeJob(job.jobId, {
    articleId,
    publicationReadiness: diagnosis.publicationReadiness,
    problemCount: diagnosis.problems.length,
  });
}

async function growthCheckWorker(job: DeptoJob): Promise<void> {
  const db = getAdminDb();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const countSnap = await db.collection('nios_growth_opportunities').where('createdAt', '>=', since).count().get();
  const count = countSnap.data().count || 0;

  await recordLearning({
    source: 'departamento-central',
    kind: 'learning',
    note: `Revisión de crecimiento: ${count} oportunidades detectadas en las últimas 24h.`,
    tags: ['growth', 'seo', '24x7'],
  });

  await writeHeartbeat('growth', 'healthy');
  await completeJob(job.jobId, { opportunities24h: count });
}

async function monetizationCheckWorker(job: DeptoJob): Promise<void> {
  const db = getAdminDb();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const trafficSnap = await db.collection('nios_traffic').where('collectedAt', '>=', since).count().get();
  const count = trafficSnap.data().count || 0;

  await recordLearning({
    source: 'departamento-central',
    kind: 'learning',
    note: `Revisión de monetización: ${count} registros de tráfico en las últimas 24h.`,
    tags: ['monetización', 'adsense', '24x7'],
  });

  await writeHeartbeat('monetization-check', 'healthy');
  await completeJob(job.jobId, { trafficRecords24h: count });
}

async function watchdogRecoveryWorker(job: DeptoJob): Promise<void> {
  const component = String(job.payload?.component || 'watchdog');

  // Recuperar el componente crítico ejecutando su worker correspondiente.
  switch (component) {
    case 'health-check':
    case 'site-availability':
      await healthCheckWorker(job);
      break;
    case 'growth':
    case 'growth-check':
      await growthCheckWorker(job);
      break;
    case 'monetization-check':
      await monetizationCheckWorker(job);
      break;
    case 'article-pipeline':
      await writeHeartbeat('article-pipeline', 'healthy');
      await completeJob(job.jobId, { action: 'watchdog-recovery', component });
      break;
    default:
      await writeHeartbeat(component as DeptoHeartbeat['component'], 'healthy');
      await completeJob(job.jobId, { action: 'watchdog-recovery', component });
  }

  await writeHeartbeat('watchdog', 'healthy');
}

function isFreshArticle(createdAt: string | undefined): boolean {
  if (!createdAt) return true;
  return Date.now() - new Date(createdAt).getTime() < MAX_ARTICLE_AGE_MS;
}

export async function executeJob(job: DeptoJob): Promise<void> {
  logger.info('[depto-workers] Ejecutando trabajo', { jobId: job.jobId, type: job.type });

  try {
    switch (job.type as DeptoJobType) {
      case 'health-check':
      case 'site-availability':
        await healthCheckWorker(job);
        break;
      case 'daily-report':
        await dailyReportWorker(job);
        break;
      case 'article-pipeline':
        if (!isFreshArticle(job.payload?.createdAt as string | undefined)) {
          await completeJob(job.jobId, { skipped: true, reason: 'Artículo demasiado antiguo para autoprocesar.' });
        } else {
          await articlePipelineWorker(job);
        }
        break;
      case 'growth-check':
        await growthCheckWorker(job);
        break;
      case 'monetization-check':
        await monetizationCheckWorker(job);
        break;
      case 'watchdog':
        await watchdogRecoveryWorker(job);
        break;
      case 'operational-repair':
        {
          const db = getAdminDb();
          const result = await executeOperationalRepair(db, job);
          await completeJob(job.jobId, result);
        }
        break;
      default:
        await completeJob(job.jobId, { skipped: true, reason: 'Tipo de trabajo no implementado' });
    }
    job.status = 'completed';
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('[depto-workers] Trabajo falló', { jobId: job.jobId, type: job.type, error: message });
    await failJob(job.jobId, message);
    job.status = 'failed';
  }
}
