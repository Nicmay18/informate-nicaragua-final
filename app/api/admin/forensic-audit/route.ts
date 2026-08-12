import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { verifyAdminToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function stripHtml(html: string): string {
  return (html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

const THIN_THRESHOLD = 400;

function detectThin(a: { palabras: number; tags: string[]; relatedLinksCount: number; autor: string; gscImpressions: number; scoreMeni: number | null }) {
  const flags: string[] = [];
  if (a.palabras < THIN_THRESHOLD) flags.push(`<${THIN_THRESHOLD} palabras (${a.palabras})`);
  if (a.palabras > 0 && a.palabras < 200) flags.push('muy corto');
  if (!a.tags || a.tags.length < 2) flags.push('pocos tags');
  if (!a.relatedLinksCount || a.relatedLinksCount < 1) flags.push('sin enlaces');
  if (!a.autor || !a.autor.trim()) flags.push('sin autor');
  if (a.palabras >= 200 && a.gscImpressions === 0 && a.scoreMeni !== null && a.scoreMeni < 80) flags.push('meni bajo + 0 impresiones');
  return { isThin: flags.length > 0, flags };
}

function detectDupRisk(a: { palabras: number; gscImpressions: number; scoreMeni: number | null }) {
  if (a.palabras < 200 && a.gscImpressions === 0) return true;
  if (a.palabras > 0 && a.scoreMeni !== null && a.scoreMeni < 60) return true;
  return false;
}

export async function GET(request: NextRequest) {
  // Bypass auth when no ADMIN_API_KEY is configured (local diagnostics)
  const hasAdminKey = !!process.env.ADMIN_API_KEY;
  if (hasAdminKey) {
    const token = request.headers.get('x-admin-token') || request.headers.get('x-admin-key') || '';
    if (!verifyAdminToken(token)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
  }

  const db = getAdminDb();
  const snap = await db.collection('noticias').get();
  const total = snap.size;

  let conMeni = 0, sinMeni = 0;
  let palMatch = 0, palDiff = 0, palMissing = 0;
  let thinCount = 0, thinByLength = 0, thinByAux = 0;
  let dupRiskCount = 0;
  let conAutor = 0, conTags = 0, conLinks = 0;
  const scores: Record<string, number> = { '0-49': 0, '50-69': 0, '70-89': 0, '90-100': 0, 'null': 0 };
  const profiles: Record<string, number> = {};
  const categories: Record<string, number> = {};
  const rows: any[] = [];

  for (const doc of snap.docs) {
    const d = doc.data();
    const palabrasReales = countWords(stripHtml(d.contenido || ''));
    const palabrasStored = d.palabras || 0;
    const hasMeni = d.scoreMeni !== undefined && d.scoreMeni !== null;

    if (hasMeni) conMeni++; else sinMeni++;

    if (palabrasStored === 0) palMissing++;
    else if (Math.abs(palabrasStored - palabrasReales) <= 5) palMatch++;
    else palDiff++;

    const article = {
      palabras: palabrasReales,
      tags: d.tags || [],
      relatedLinksCount: (d.related_links || []).length,
      autor: d.autor || '',
      gscImpressions: 0,
      scoreMeni: hasMeni ? d.scoreMeni : null,
    };

    const thin = detectThin(article);
    if (thin.isThin) {
      thinCount++;
      if (thin.flags.some(f => f.includes('palabras'))) thinByLength++;
      else thinByAux++;
    }

    if (detectDupRisk(article)) dupRiskCount++;
    if (article.autor.trim()) conAutor++;
    if (article.tags.length >= 2) conTags++;
    if (article.relatedLinksCount >= 1) conLinks++;

    const s = hasMeni ? d.scoreMeni : null;
    if (s === null) scores['null']++;
    else if (s < 50) scores['0-49']++;
    else if (s < 70) scores['50-69']++;
    else if (s < 90) scores['70-89']++;
    else scores['90-100']++;

    const p = d.profile || d.perfil || 'N/A';
    profiles[p] = (profiles[p] || 0) + 1;
    const c = d.categoria || 'N/A';
    categories[c] = (categories[c] || 0) + 1;

    rows.push({
      id: doc.id,
      titulo: (d.titulo || '').slice(0, 60),
      fecha: d.fecha || '',
      palStored: palabrasStored,
      palReales: palabrasReales,
      palDiff: palabrasReales - palabrasStored,
      scoreMeni: hasMeni ? d.scoreMeni : null,
      aprobadoMeni: d.aprobadoMeni ?? null,
      nivel: d.nivel || null,
      nivelScore: d.nivelScore ?? null,
      profile: d.profile || d.perfil || 'N/A',
      categoria: d.categoria || 'N/A',
      autor: d.autor || '',
      tagsCount: (d.tags || []).length,
      relatedLinksCount: article.relatedLinksCount,
      thinFlags: thin.flags,
      isThin: thin.isThin,
      dupRisk: detectDupRisk(article),
    });
  }

  return NextResponse.json({
    summary: {
      total,
      conMeni,
      sinMeni,
      palabras: { match: palMatch, diff: palDiff, missing: palMissing },
      thin: { total: thinCount, byLength: thinByLength, byAuxSignals: thinByAux },
      dupRisk: dupRiskCount,
      autor: conAutor,
      tagsOk: conTags,
      linksOk: conLinks,
      scores,
      profiles,
      categories,
    },
    rows,
  });
}
