/**
 * Calibración de MENI — mide si el score predice resultados reales.
 *
 * NO cambia el score. Solo responde con datos:
 *   - precisión por campo de predicción (publicar / portada)
 *   - falsos positivos / falsos negativos
 *   - calibración por nivel de confianza declarada
 *   - calibración score → resultado Google (GSC REAL del snapshot)
 *
 * Una predicción solo entra a las métricas si el validador la marcó
 * VALIDATED con fuente real — nunca se infiere el resultado.
 */
import type { Firestore } from 'firebase-admin/firestore';
import type { PredictionValidation } from './prediction-validator';

export interface CalibrationReport {
  generatedAt: string;
  predictions: {
    total: number;
    validated: number;
    pending: number;
    insufficientData: number;
  };
  publicar: { validated: number; correct: number; falsePositives: number; falseNegatives: number; accuracy: number | null };
  portada: { validated: number; correct: number; falsePositives: number; falseNegatives: number; accuracy: number | null };
  confianzaCalibration: { bucket: string; validated: number; correctRate: number | null }[];
  scoreVsGoogle: {
    // score ≥90 que Google valoró (impresiones) vs ignoró — mide si el score
    // tiene poder predictivo real o solo mide cumplimiento de reglas.
    bucket90plus: { total: number; googleValues: number; lowVisibility: number; rate: number | null };
    bucketBelow90: { total: number; googleValues: number; lowVisibility: number; rate: number | null };
  };
  honestNotes: string[];
}

function bucketConfianza(c: number): string {
  if (c >= 90) return '90-100';
  if (c >= 80) return '80-89';
  if (c >= 70) return '70-79';
  return '<70';
}

export async function computeCalibrationReport(db: Firestore): Promise<CalibrationReport> {
  const honestNotes: string[] = [];

  const predSnap = await db.collection('meni_predictions').limit(500).get();
  let validated = 0;
  let pending = 0;
  let insufficientData = 0;

  const pub = { validated: 0, correct: 0, falsePositives: 0, falseNegatives: 0 };
  const por = { validated: 0, correct: 0, falsePositives: 0, falseNegatives: 0 };
  const byConf = new Map<string, { validated: number; correct: number }>();

  for (const d of predSnap.docs) {
    const p = d.data();
    const v = p.validation as PredictionValidation | undefined;
    if (!v?.summary) { pending++; continue; }
    validated++;

    const bucket = bucketConfianza(Number(p.confianza ?? 0));
    const agg = byConf.get(bucket) ?? { validated: 0, correct: 0 };

    for (const [field, acc] of [['publicar', pub], ['portada', por]] as const) {
      const r = v[field];
      if (!r || r.status !== 'VALIDATED') continue;
      acc.validated++;
      if (r.correct) acc.correct++;
      else {
        // FP: predijo SI y pasó NO. FN: predijo NO y pasó SI.
        const predPos = field === 'publicar'
          ? (r.predicted === true || r.predicted === 'SI')
          : String(r.predicted) !== 'No va a portada';
        if (predPos) acc.falsePositives++; else acc.falseNegatives++;
      }
      agg.validated++;
      if (r.correct) agg.correct++;
    }
    byConf.set(bucket, agg);

    if ((v.summary.insufficient ?? 0) > 0) insufficientData++;
  }

  // Score → resultado Google, desde el snapshot más reciente (datos GSC REAL)
  const snapDoc = await db.collection('nios_daily_snapshots').orderBy('date', 'desc').limit(1).get();
  const scoreVsGoogle = {
    bucket90plus: { total: 0, googleValues: 0, lowVisibility: 0, rate: null as number | null },
    bucketBelow90: { total: 0, googleValues: 0, lowVisibility: 0, rate: null as number | null },
  };
  if (!snapDoc.empty) {
    const arts = await db.collection('nios_daily_snapshots').doc(snapDoc.docs[0].id)
      .collection('articles').limit(1000).get();
    for (const d of arts.docs) {
      const a = d.data();
      const score = a.scoreMeni;
      if (score == null || a.gscStatus !== 'REAL') continue;
      const b = score >= 90 ? scoreVsGoogle.bucket90plus : scoreVsGoogle.bucketBelow90;
      b.total++;
      if ((a.gscImpressions ?? 0) > 0) b.googleValues++; else b.lowVisibility++;
    }
    for (const b of [scoreVsGoogle.bucket90plus, scoreVsGoogle.bucketBelow90]) {
      b.rate = b.total > 0 ? Math.round((b.googleValues / b.total) * 1000) / 10 : null;
    }
  } else {
    honestNotes.push('Sin snapshot GSC: calibración score→Google no medible');
  }

  if (validated === 0) honestNotes.push('0 predicciones validadas — el validador necesita correr tras la ventana de observación (7 días)');
  honestNotes.push('predFacebook y predDiscover no tienen fuente real hoy (sin métricas FB; GSC sin searchAppearance=DISCOVER) → siempre INSUFFICIENT_DATA');

  const acc = (x: { validated: number; correct: number }) =>
    x.validated > 0 ? Math.round((x.correct / x.validated) * 1000) / 10 : null;

  return {
    generatedAt: new Date().toISOString(),
    predictions: { total: predSnap.size, validated, pending, insufficientData },
    publicar: { ...pub, accuracy: acc(pub) },
    portada: { ...por, accuracy: acc(por) },
    confianzaCalibration: [...byConf.entries()].map(([bucket, v]) => ({
      bucket,
      validated: v.validated,
      correctRate: v.validated > 0 ? Math.round((v.correct / v.validated) * 1000) / 10 : null,
    })).sort((a, b) => a.bucket.localeCompare(b.bucket)),
    scoreVsGoogle,
    honestNotes,
  };
}
