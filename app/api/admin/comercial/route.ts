import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest, unauthorized } from '@/lib/auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import {
  AUSPICIADORES_COLLECTION,
  ADS_DAILY_COLLECTION,
  estadoAuspiciador,
  ctr,
  diasParaVencer,
  type Auspiciador,
} from '@/lib/ads/auspiciadores';

export const dynamic = 'force-dynamic';

/**
 * Resumen comercial: audiencia (traffic_daily + traffic_log) + publicidad
 * (auspiciadores + ads_daily). Todo agregado, sin PII. El nivel de detalle
 * geográfico disponible es país únicamente (x-vercel-ip-country); nunca se
 * presenta como ubicación exacta.
 */

const LOG_LIMIT = 5000;

function dateKeys(days: number): string[] {
  const out: string[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    out.push(new Date(today.getTime() - i * 86_400_000).toISOString().slice(0, 10));
  }
  return out;
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();

  const days = Math.min(60, Math.max(7, Number(request.nextUrl.searchParams.get('dias')) || 30));
  const keys = dateKeys(days);
  const since = new Date(`${keys[0]}T00:00:00Z`);

  try {
    const db = getAdminDb();

    // --- Audiencia ---
    const [dayDocs, articlesSnaps, logSnap] = await Promise.all([
      Promise.all(keys.map((k) => db.collection('traffic_daily').doc(k).get())),
      Promise.all(keys.map((k) => db.collection('traffic_daily').doc(k).collection('articles').get())),
      db
        .collection('traffic_log')
        .where('timestamp', '>=', since)
        .select('sessionId', 'country', 'slug')
        .limit(LOG_LIMIT)
        .get(),
    ]);

    const diaria: { date: string; views: number }[] = [];
    const paisesDay: Record<string, number> = {};
    const porArticulo: Record<string, { slug: string; titulo?: string; views: number }> = {};

    // Vistas por día: agregado del doc padre (nuevo) o suma de la subcolección
    // articles (histórico); se toma el mayor para cubrir ambos períodos.
    const subcolPorDia = articlesSnaps.map((snap) => {
      let total = 0;
      for (const doc of snap.docs) {
        const a = doc.data();
        const v = typeof a.views === 'number' ? a.views : 0;
        total += v;
        const entry = porArticulo[doc.id] || { slug: doc.id, titulo: a.titulo || doc.id, views: 0 };
        entry.views += v;
        porArticulo[doc.id] = entry;
      }
      return total;
    });

    dayDocs.forEach((d, i) => {
      const data = d.data() || {};
      const dayViews = typeof data.views === 'number' ? data.views : 0;
      diaria.push({ date: keys[i], views: Math.max(dayViews, subcolPorDia[i]) });
      for (const [cc, n] of Object.entries((data.countries as Record<string, number>) || {})) {
        paisesDay[cc] = (paisesDay[cc] || 0) + n;
      }
    });

    const viewsSubcol = subcolPorDia.reduce((s, v) => s + v, 0);

    const sesiones = new Set<string>();
    const paisesLog: Record<string, number> = {};
    for (const doc of logSnap.docs) {
      const d = doc.data();
      if (d.sessionId) sesiones.add(d.sessionId);
      if (d.country) paisesLog[d.country] = (paisesLog[d.country] || 0) + 1;
    }

    // Vistas del período: máximo entre agregado de subcolección (histórico)
    // y agregado del doc padre (nuevo); el log acota como verdad mínima.
    const pageviews = Math.max(viewsSubcol, diaria.reduce((s, d) => s + d.views, 0), logSnap.size);
    const paises = Object.keys({ ...paisesDay, ...paisesLog })
      .map((cc) => ({ codigo: cc, eventos: (paisesDay[cc] || 0) + (paisesLog[cc] || 0) }))
      .sort((a, b) => b.eventos - a.eventos)
      .slice(0, 12);

    const byMonth: Record<string, number> = {};
    for (const d of diaria) byMonth[d.date.slice(0, 7)] = (byMonth[d.date.slice(0, 7)] || 0) + d.views;
    const mensual = Object.entries(byMonth).map(([mes, views]) => ({ mes, views }));

    // --- Publicidad ---
    const [sponsorsSnap, adsDailySnap] = await Promise.all([
      db.collection(AUSPICIADORES_COLLECTION).get(),
      db.collection(ADS_DAILY_COLLECTION).where('date', '>=', keys[0]).limit(2000).get(),
    ]);

    const now = new Date();
    const adsDaily: Record<string, { impresiones: number; clics: number }> = {};
    for (const doc of adsDailySnap.docs) {
      const d = doc.data();
      const entry = adsDaily[d.sponsorId] || { impresiones: 0, clics: 0 };
      entry.impresiones += d.impresiones || 0;
      entry.clics += d.clics || 0;
      adsDaily[d.sponsorId] = entry;
    }

    const auspiciadores = sponsorsSnap.docs.map((doc) => {
      const a = doc.data() as Auspiciador;
      const periodo = adsDaily[doc.id] || { impresiones: 0, clics: 0 };
      return {
        id: doc.id,
        nombre: a.nombre,
        estado: estadoAuspiciador(a, now),
        impresiones: a.impresiones || 0,
        clics: a.clics || 0,
        ctr: ctr(a.impresiones || 0, a.clics || 0),
        ctrPeriodo: ctr(periodo.impresiones, periodo.clics),
        diasParaVencer: diasParaVencer(a.fechaVencimiento, now),
        fechaVencimiento: a.fechaVencimiento,
      };
    });

    const res = NextResponse.json({
      ok: true,
      generado: now.toISOString(),
      audiencia: {
        pageviews,
        sesionesAprox: sesiones.size,
        sesionesNota: 'sessionId anónimo único; sin IP ni cookies persistentes',
        paises,
        geoNota: 'País aproximado por edge (x-vercel-ip-country). No hay dato fiable de ciudad/departamento.',
        diaria,
        mensual,
        topArticulos: Object.values(porArticulo).sort((a, b) => b.views - a.views).slice(0, 15),
      },
      publicidad: {
        auspiciadores,
        activos: auspiciadores.filter((a) => a.estado === 'activo').length,
        porVencer: auspiciadores.filter((a) => a.estado === 'activo' && a.diasParaVencer <= 7).length,
      },
    });
    res.headers.set('Cache-Control', 'private, no-store');
    return res;
  } catch (err) {
    logger.error('[admin/comercial] failed:', err);
    return NextResponse.json({ ok: false, error: 'No se pudo generar el resumen comercial' }, { status: 500 });
  }
}
