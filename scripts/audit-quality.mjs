// Read-only production audit. No credentials, cookies or administrative writes.
// node scripts/audit-quality.mjs inventory|production|browser|performance
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { execFileSync, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const root = process.cwd();
const out = path.join(root, 'docs/auditoria-18');
fs.mkdirSync(out, { recursive: true });
const base = 'https://nicaraguainformate.com';
const write = (name, value) => fs.writeFileSync(path.join(out, name), JSON.stringify(value, null, 2) + '\n');
const sha = () => execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const get = async url => {
  const start = Date.now();
  const r = await fetch(url, { signal: AbortSignal.timeout(60000), redirect: 'manual',
    headers: { 'User-Agent': 'Mozilla/5.0 (Nicaragua Informate quality audit)' } });
  const body = await r.text();
  return { at: new Date().toISOString(), url, status: r.status, elapsedMs: Date.now() - start,
    headers: Object.fromEntries([...r.headers].filter(([k]) => k !== 'set-cookie')), body };
};
const { JSDOM } = require('jsdom');
function htmlInfo(body) {
  const d = new JSDOM(body).window.document;
  const meta = name => d.querySelector(`meta[name="${name}"],meta[property="${name}"]`)?.content ?? null;
  return { title: d.title, description: meta('description'), robots: meta('robots'),
    canonical: [...d.querySelectorAll('link[rel=canonical]')].map(x => x.href),
    og: { title: meta('og:title'), image: meta('og:image'), url: meta('og:url') },
    h1: [...d.querySelectorAll('h1')].map(x => x.textContent?.trim()),
    articleTextChars: d.querySelector('article')?.textContent?.length ?? 0,
    dates: [...d.querySelectorAll('time')].map(x => ({ datetime: x.dateTime, text: x.textContent?.trim() })),
    jsonld: [...d.querySelectorAll('script[type="application/ld+json"]')].map(x => {
      try { return JSON.parse(x.textContent); } catch { return { invalid: true }; }
    }),
    imagesMissingAlt: d.querySelectorAll('img:not([alt])').length,
    newsLinks: [...new Set([...d.querySelectorAll('a[href]')].map(x => x.getAttribute('href'))
      .filter(x => x?.startsWith('/noticias/')))],
    externalLinks: [...new Set([...d.querySelectorAll('article a[href]')].map(x => x.href)
      .filter(x => x.startsWith('https://') && !x.startsWith(base)))] };
}
async function production() {
  const startedAt = new Date().toISOString();
  const home = await get(base + '/');
  const sitemap = await get(base + '/sitemap.xml');
  const urls = [...sitemap.body.matchAll(/<loc>(.*?)<\/loc>/g)].map(x => x[1]);
  const articles = htmlInfo(home.body).newsLinks.slice(0, 2).map(x => base + x);
  if (articles.length < 2) throw new Error('Need two actual article links');
  const targets = [...new Set([base + '/', base + '/sitemap.xml', base + '/news-sitemap.xml',
    base + '/robots.txt', base + '/feed.xml', base + '/ads.txt', base + '/negocios',
    base + '/negocios/alta', base + '/categoria/nacionales', ...articles,
    ...['/guia/', '/autor/', '/tema/', '/entidad/'].map(p => urls.find(x => x.includes(p))).filter(Boolean),
    base + '/noticias/auditoria-18-url-inexistente-8b5bc7', base + '/admin/negocios',
    base + '/api/admin/negocios', base + '/api/admin/auspiciadores'])];
  const rows = [];
  for (const [i, url] of targets.entries()) {
    try {
      const r = url === home.url ? home : url === sitemap.url ? sitemap : await get(url);
      const { body, ...meta } = r;
      fs.writeFileSync(path.join(out, `response-${i}.gz`), gzipSync(body));
      rows.push({ ...meta, bodySha256: createHash('sha256').update(body).digest('hex'),
        bodyFile: `response-${i}.gz`, bytes: Buffer.byteLength(body),
        ...(r.headers['content-type']?.includes('text/html') ? { html: htmlInfo(body) } : {}) });
      console.log(r.status, url);
    } catch (e) { rows.push({ url, error: e.message }); }
  }
  const comparisons = [];
  await new Promise(r => setTimeout(r, 65000));
  for (const url of [base + '/', base + '/negocios', base + '/negocios?audit18=1']) {
    const { body, ...meta } = await get(url);
    comparisons.push({ ...meta, bodySha256: createHash('sha256').update(body).digest('hex'), html: htmlInfo(body) });
  }
  write('production.json', { startedAt, finishedAt: new Date().toISOString(), sourceSha: sha(),
    rows, comparisons, articles, sitemap: { count: urls.length, duplicateUrls: urls.filter((v, i) => urls.indexOf(v) !== i) } });
}
function inventory() {
  const files = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean);
  const buckets = {};
  const rows = files.map(file => {
    const data = fs.readFileSync(file);
    const area = file.includes('/') ? file.split('/')[0] : '(root)';
    const hash = createHash('sha256').update(data).digest('hex');
    (buckets[hash] ??= []).push(file);
    const artifact = /^(?:\.audit|reports|articulos-generados|articulos-seo)\//.test(file)
      || /^[^/]+\.(md|log|csv)$/.test(file) || /(?:FORENSIC|AUDITORIA)/.test(file);
    return { file, area, bytes: data.length, sha256: hash,
      status: artifact ? 'historico: revisar retencion' : 'inventariado: ver matriz por area',
      evidence: artifact ? 'No demuestra obsolescencia; conservar' : 'Clasificacion automatica; no certifica revision manual individual' };
  });
  fs.writeFileSync(path.join(out, 'inventory.csv'), ['file,area,bytes,sha256,status,evidence',
    ...rows.map(r => Object.values(r).map(v => `"${String(v).replaceAll('"', '""')}"`).join(','))].join('\n') + '\n');
  write('inventory-summary.json', { at: new Date().toISOString(), sha: sha(), count: rows.length,
    areas: rows.reduce((acc, r) => ({ ...acc, [r.area]: (acc[r.area] ?? 0) + 1 }), {}),
    exactDuplicates: Object.values(buckets).filter(x => x.length > 1) });
}
async function browser() {
  const { chromium } = require('playwright');
  const b = await chromium.launch({ headless: true });
  const { articles } = JSON.parse(fs.readFileSync(path.join(out, 'production.json')));
  const rows = [];
  try {
    for (const width of [360, 768, 1440]) for (const [i, url] of [base + '/', ...articles].entries()) {
      const p = await b.newPage({ viewport: { width, height: 900 } });
      const errors = [];
      p.on('pageerror', e => errors.push(e.message));
      // Do not send telemetry from the audit browser.
      await p.route('**/api/telemetry/**', r => r.abort());
      await p.route('**/api/track-view**', r => r.abort());
      try {
        const response = await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await p.waitForTimeout(3000);
        await p.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
        const axe = await p.evaluate(async () => window.axe.run(document, {
          runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] },
        }));
        const layout = await p.evaluate(() => ({
          viewport: innerWidth, scrollWidth: document.documentElement.scrollWidth,
          h1: [...document.querySelectorAll('h1')].map(e => e.textContent),
          brokenImages: [...document.images].filter(e => e.complete && e.naturalWidth === 0).map(e => e.currentSrc),
        }));
        const focus = [];
        for (let j = 0; j < 8; j++) {
          await p.keyboard.press('Tab');
          focus.push(await p.evaluate(() => {
            const e = document.activeElement, s = getComputedStyle(e);
            return { tag: e.tagName, text: (e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 80),
              outline: s.outline, boxShadow: s.boxShadow };
          }));
        }
        const screenshot = `screen-${i}-${width}.png`;
        await p.screenshot({ path: path.join(out, screenshot), fullPage: false });
        rows.push({ at: new Date().toISOString(), url, width, status: response.status(), layout, focus,
          errors, screenshot, axe: { version: axe.testEngine.version, violations: axe.violations,
            incomplete: axe.incomplete.map(x => ({ id: x.id, impact: x.impact, count: x.nodes.length })),
            passes: axe.passes.length } });
      } catch (e) { rows.push({ url, width, error: e.message }); }
      await p.close();
    }
  } finally { await b.close(); }
  write('browser.json', rows);
  console.log(rows.map(r => ({ url: r.url, width: r.width, error: r.error,
    violations: r.axe?.violations.map(v => [v.id, v.nodes.length]), overflow: r.layout && r.layout.scrollWidth > r.width })));
}
function performance() {
  const { chromium } = require('playwright');
  const { articles } = JSON.parse(fs.readFileSync(path.join(out, 'production.json')));
  const npmCli = path.join(path.dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js');
  const rows = [];
  for (const [i, url] of [base + '/', ...articles].entries()) for (const preset of ['mobile', 'desktop']) {
    const filename = `lighthouse-${i}-${preset}.json`;
    const full = path.join(out, filename);
    const args = [npmCli, 'exec', '--yes', '--package=lighthouse@12.8.2', '--', 'lighthouse', url,
      '--output=json', `--output-path=${full}`, '--chrome-flags=--headless --no-sandbox',
      '--only-categories=performance,accessibility,best-practices,seo', '--quiet'];
    if (preset === 'desktop') args.push('--preset=desktop');
    const result = spawnSync(process.execPath, args, { encoding: 'utf8', timeout: 240000,
      env: { ...process.env, CHROME_PATH: chromium.executablePath() }, maxBuffer: 5 * 1024 * 1024 });
    if (result.status !== 0 || !fs.existsSync(full)) {
      rows.push({ url, preset, status: 'BLOQUEADA', at: new Date().toISOString(),
        error: result.error?.message || result.stderr?.slice(-2000), command: ['node', ...args].join(' ') });
    } else {
      const raw = fs.readFileSync(full);
      const lhr = JSON.parse(raw);
      fs.writeFileSync(full + '.gz', gzipSync(raw));
      fs.unlinkSync(full);
      const ids = ['first-contentful-paint', 'largest-contentful-paint', 'total-blocking-time',
        'cumulative-layout-shift', 'server-response-time', 'total-byte-weight', 'network-requests'];
      rows.push({ url, preset, at: lhr.fetchTime, version: lhr.lighthouseVersion, finalUrl: lhr.finalDisplayedUrl,
        config: lhr.configSettings, report: filename + '.gz', runtimeError: lhr.runtimeError,
        warnings: lhr.runWarnings, scores: Object.fromEntries(Object.entries(lhr.categories).map(([k, v]) => [k, v.score])),
        metrics: Object.fromEntries(ids.map(id => [id, { value: lhr.audits[id]?.numericValue,
          unit: lhr.audits[id]?.numericUnit, display: lhr.audits[id]?.displayValue,
          ...(id === 'network-requests' ? { count: lhr.audits[id]?.details?.items?.length } : {}) }])),
        diagnostics: Object.values(lhr.audits).filter(a => a.score !== null && a.score < 0.9)
          .map(a => ({ id: a.id, score: a.score, title: a.title, display: a.displayValue })) });
    }
    write('performance.json', rows);
    console.log(url, preset, rows.at(-1).scores || rows.at(-1).status);
  }
}
const mode = process.argv[2];
if (mode === 'inventory') inventory();
else if (mode === 'production') await production();
else if (mode === 'browser') await browser();
else if (mode === 'performance') performance();
else throw new Error('Choose inventory|production|browser|performance');
