#!/usr/bin/env node
/**
 * compare-billing.mjs — Comparador reproducible de costos Google Cloud Billing
 * antes/después del despliegue de PR #45 (commit 77bc9e61, live ~2026-11-22T17:30Z).
 *
 * Uso:
 *   node scripts/compare-billing.mjs \
 *     --before billing-pre.csv \
 *     --after  billing-post.csv \
 *     [--pre-from 2026-11-08] [--pre-to 2026-11-21] \
 *     [--post-from 2026-11-23] [--post-to 2026-12-06] \
 *     [--out informe.md]
 *
 * Entrada esperada: CSV descargado de Cloud Console → Billing → Reports
 *   (Billing account 017858-4F02A9-A3CFD8), agrupado por:
 *     Project → Service → SKU → Date (o Service → SKU → Date)
 *   Columnas reconocidas (case-insensitive, tolerante):
 *     date/day, service, sku, cost, usage, currency, project
 *
 * Ventanas recomendadas (billing es diario; el 22-nov es día mixto → se excluye):
 *   PRE  : 2026-11-08 → 2026-11-21  (14 días completos pre-deploy)
 *   POST : 2026-11-23 → 2026-12-06  (14 días completos post-deploy)
 *   Referencia secundaria: 1–21 nov agregado ya conocido (US$43.66).
 *
 * Salida: tabla Markdown por SKU con costo/uso antes, después, delta absoluto
 * y porcentual, promedios por día y veredicto. NO modifica nada en producción.
 */

import { readFileSync, writeFileSync } from 'node:fs';

// ---------- args ----------
const args = process.argv.slice(2);
function arg(name, dflt = null) {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : dflt;
}
const beforeFiles = arg('before') ? [arg('before')] : [];
const afterFile = arg('after');
const extraBefore = args.flatMap((a, i) => (a === '--before-more' ? [args[i + 1]] : []));
const allBefore = [...beforeFiles, ...extraBefore].filter(Boolean);
const outFile = arg('out');
const preFrom = arg('pre-from');
const preTo = arg('pre-to');
const postFrom = arg('post-from');
const postTo = arg('post-to');
const only = arg('only') ? new RegExp(arg('only'), 'i') : null;

if (!allBefore.length || !afterFile) {
  console.error('Uso: --before <csv> [--before-more <csv>...] --after <csv> [--pre-from D --pre-to D --post-from D --post-to D] [--only regex] [--out file.md]');
  process.exit(1);
}

// ---------- CSV parser (soporta comillas y comas dentro de campos) ----------
function parseCSV(text) {
  const rows = [];
  let row = [], field = '', inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQ = false;
      } else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some(f => f.trim() !== '')) rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== '' || row.length) { row.push(field); if (row.some(f => f.trim() !== '')) rows.push(row); }
  return rows;
}

function normDate(v) {
  v = (v || '').trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);
  const d = new Date(v);
  if (!isNaN(d)) return d.toISOString().slice(0, 10);
  return null;
}

function num(v) {
  if (v == null) return 0;
  const n = parseFloat(String(v).replace(/[$,\s]/g, '').replace(/[^\d.\-eE]/g, ''));
  return isNaN(n) ? 0 : n;
}

function findCol(header, re) {
  return header.findIndex(h => re.test(h.trim()));
}

function loadBilling(files, label) {
  const agg = new Map(); // key: service|sku|date -> {cost, usage}
  const dates = new Set();
  let totalRows = 0;
  for (const file of files) {
    const rows = parseCSV(readFileSync(file, 'utf8'));
    if (!rows.length) { console.error(`⚠️  ${file}: vacío`); continue; }
    const header = rows[0].map(h => h.trim());
    const iDate = findCol(header, /^(date|day|usage date|billing date)/i) >= 0 ? findCol(header, /^(date|day|usage date|billing date)/i) : findCol(header, /date/i);
    const iService = findCol(header, /service/i);
    const iSku = findCol(header, /sku|sku description|sku id/i);
    const iCost = findCol(header, /^cost/i) >= 0 ? findCol(header, /^cost/i) : findCol(header, /cost/i);
    const iUsage = findCol(header, /^usage(?!.*unit)/i) >= 0 ? findCol(header, /^usage(?!.*unit)/i) : findCol(header, /^usage/i);
    if (iDate < 0 || iCost < 0) {
      console.error(`⚠️  ${file}: no se encontraron columnas date/cost. Header: ${header.join(' | ')}`);
      continue;
    }
    for (const r of rows.slice(1)) {
      const date = normDate(r[iDate]);
      if (!date) continue;
      const service = iService >= 0 ? (r[iService] || 'Desconocido') : 'Desconocido';
      const sku = iSku >= 0 ? (r[iSku] || '(sin SKU)') : '(sin SKU)';
      const cost = num(r[iCost]);
      const usage = iUsage >= 0 ? num(r[iUsage]) : 0;
      if (only && !only.test(`${service} ${sku}`)) continue;
      const key = `${service}|${sku}|${date}`;
      const cur = agg.get(key) || { cost: 0, usage: 0 };
      cur.cost += cost; cur.usage += usage;
      agg.set(key, cur);
      dates.add(date);
      totalRows++;
    }
  }
  return { agg, dates: [...dates].sort(), totalRows, label };
}

// ---------- ventanas ----------
function inWindow(date, from, to) {
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
}
function windowDays(from, to) {
  if (!from || !to) return null;
  return Math.round((new Date(to) - new Date(from)) / 86400000) + 1;
}

function summarize(data, from, to) {
  const bySku = new Map();
  const datesInWin = new Set();
  for (const [key, v] of data.agg) {
    const [service, sku, date] = key.split('|');
    if (!inWindow(date, from, to)) continue;
    const k = `${service}|${sku}`;
    const cur = bySku.get(k) || { service, sku, cost: 0, usage: 0, dates: new Set() };
    cur.cost += v.cost; cur.usage += v.usage; cur.dates.add(date);
    bySku.set(k, cur);
    datesInWin.add(date);
  }
  const days = from && to ? windowDays(from, to) : datesInWin.size;
  return { bySku: [...bySku.values()], days: days || datesInWin.size, observedDays: datesInWin.size, dates: [...datesInWin].sort() };
}

// ---------- main ----------
const pre = loadBilling(allBefore, 'PRE');
const post = loadBilling([afterFile], 'POST');

const preSum = summarize(pre, preFrom || pre.dates[0], preTo || pre.dates[pre.dates.length - 1]);
const postSum = summarize(post, postFrom || post.dates[0], postTo || post.dates[post.dates.length - 1]);

const preMap = new Map(preSum.bySku.map(s => [`${s.service}|${s.sku}`, s]));
const postMap = new Map(postSum.bySku.map(s => [`${s.service}|${s.sku}`, s]));
const allKeys = [...new Set([...preMap.keys(), ...postMap.keys()])];

const rows = allKeys.map(k => {
  const a = preMap.get(k) || { cost: 0, usage: 0, service: k.split('|')[0], sku: k.split('|').slice(1).join('|') };
  const b = postMap.get(k) || { cost: 0, usage: 0, service: a.service, sku: a.sku };
  const dCost = b.cost - a.cost;
  const dPct = a.cost !== 0 ? (dCost / a.cost) * 100 : (b.cost !== 0 ? Infinity : 0);
  const preDay = preSum.days ? a.cost / preSum.days : 0;
  const postDay = postSum.days ? b.cost / postSum.days : 0;
  const uDay = postSum.days ? b.usage / postSum.days : 0;
  return { service: a.service, sku: a.sku, preCost: a.cost, postCost: b.cost, dCost, dPct, preDay, postDay, usageDay: uDay, preUsage: a.usage, postUsage: b.usage };
}).sort((x, y) => Math.abs(y.postCost) - Math.abs(x.postCost));

const totPre = rows.reduce((s, r) => s + r.preCost, 0);
const totPost = rows.reduce((s, r) => s + r.postCost, 0);
const totPreDay = preSum.days ? totPre / preSum.days : 0;
const totPostDay = postSum.days ? totPost / postSum.days : 0;
const dDayPct = totPreDay ? ((totPostDay - totPreDay) / totPreDay) * 100 : 0;

function fmtUsd(n) { return n === Infinity ? 'n/a' : `$${n.toFixed(2)}`; }
function fmtPct(n) { return n === Infinity ? 'nuevo' : `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`; }
function fmtNum(n) { return n >= 1000 ? n.toLocaleString('en-US', { maximumFractionDigits: 0 }) : n.toFixed(2); }

let md = `# Comparativo Billing — antes/después PR #45\n\n`;
md += `Generado: ${new Date().toISOString()}\n\n`;
md += `| Ventana | Desde | Hasta | Días |\n|---|---|---|---|\n`;
md += `| PRE (pre-deploy) | ${preFrom || pre.dates[0]} | ${preTo || pre.dates[pre.dates.length - 1]} | ${preSum.days} |\n`;
md += `| POST (post-deploy 77bc9e61) | ${postFrom || post.dates[0]} | ${postTo || post.dates[post.dates.length - 1]} | ${postSum.days} |\n\n`;

if (preSum.observedDays < preSum.days || postSum.observedDays < postSum.days) {
  md += `> ⚠️ Cobertura incompleta: PRE observó ${preSum.observedDays}/${preSum.days} días, POST ${postSum.observedDays}/${postSum.days}. Los promedios diarios usan la ventana completa — los días sin datos aparecen como $0 y subestiman el costo real.\n\n`;
}
md += `Fechas con datos PRE: ${pre.dates.join(', ')}\n\n`;
md += `Fechas con datos POST: ${post.dates.join(', ')}\n\n`;

md += `## Resumen\n\n| Métrica | PRE | POST | Delta |\n|---|---|---|---|\n`;
md += `| Costo total ventana | ${fmtUsd(totPre)} | ${fmtUsd(totPost)} | ${fmtUsd(totPost - totPre)} |\n`;
md += `| **Costo promedio diario** | **${fmtUsd(totPreDay)}** | **${fmtUsd(totPostDay)}** | **${fmtPct(dDayPct)}** |\n`;
md += `| Costo mensual equivalente (×30) | ${fmtUsd(totPreDay * 30)} | ${fmtUsd(totPostDay * 30)} | ${fmtUsd((totPostDay - totPreDay) * 30)} |\n\n`;

md += `## Detalle por SKU\n\n`;
md += `| Servicio | SKU | Costo PRE | Costo POST | Δ costo | Δ% | $/día PRE | $/día POST | Uso/día POST |\n`;
md += `|---|---|---|---|---|---|---|---|---|\n`;
for (const r of rows) {
  md += `| ${r.service} | ${r.sku} | ${fmtUsd(r.preCost)} | ${fmtUsd(r.postCost)} | ${fmtUsd(r.dCost)} | ${fmtPct(r.dPct)} | ${fmtUsd(r.preDay)} | ${fmtUsd(r.postDay)} | ${fmtNum(r.usageDay)} |\n`;
}
md += `\n## Notas metodológicas\n\n`;
md += `- **Real vs proyección**: esta tabla usa solo costos facturados/reales del CSV. Las proyecciones de Gemini Cloud Assist NO se incluyen.\n`;
md += `- **Día 22-nov excluido**: el deploy fue ~17:30 UTC; ese día mezcla código viejo y nuevo.\n`;
md += `- **Ahorro atribuido**: la diferencia POST−PRE mezcla el efecto del deploy con variación de tráfico semanal. Para aislarlo, repetir la ventana POST en semana comparable o esperar 14+ días.\n`;
md += `- **Uso/día POST**: unidades facturables por día (count para Read Ops, GiB para transferencia, GiB-month para storage).\n`;
md += `- **SKUs Firestore esperados**: Read Ops, Internet Data Transfer Out, Zonal Backup Storage, PITR Storage, Firestore Storage, Entity Writes/Deletes. Cualquier SKU nuevo que aparezca en POST es señal de un servicio adicional activado.\n`;

const report = md;
console.log(report);
if (outFile) { writeFileSync(outFile, report); console.error(`\nInforme escrito en ${outFile}`); }
