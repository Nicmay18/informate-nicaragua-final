import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { config } from 'dotenv';
import { resolve, join } from 'path';
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
} from 'fs';
import { execFileSync } from 'child_process';

config({ path: resolve(process.cwd(), '.env.local') });

const LLM_PROVIDER = process.env.LLM_PROVIDER || 'openai';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307';
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.1';
const APPROVAL_THRESHOLD = parseInt(process.env.MENI_APPROVAL_THRESHOLD || '95', 10);
const BATCH_LIMIT = parseInt(process.env.MENI_BATCH_LIMIT || '0', 10);
const DRY_RUN = process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true';
const DELAY_MS = parseInt(process.env.MENI_DELAY_MS || '500', 10);
const OUTPUT_DIR = process.env.MENI_OUTPUT_DIR || 'meni-output';

function initDb() {
  if (getApps().length > 0) return getFirestore();
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (b64 && b64.trim().length > 10) {
    const sa = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
    initializeApp({ credential: cert(sa) });
    return getFirestore();
  }
  throw new Error('FIREBASE_SERVICE_ACCOUNT_BASE64 no definida');
}

const db = initDb();

function stripHtml(html = '') {
  return html
    .replace(/<script[^>]*>.*?<\/script>/gis, ' ')
    .replace(/<style[^>]*>.*?<\/style>/gis, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function loadPrompts() {
  const cerebroPath = resolve(process.cwd(), '.devin/prompts/meni-v1.1-cerebro.md');
  const modulosPath = resolve(process.cwd(), '.devin/prompts/meni-v1.1-modulos.md');
  return {
    cerebro: readFileSync(cerebroPath, 'utf8'),
    modulos: readFileSync(modulosPath, 'utf8'),
  };
}

const PROMPTS = loadPrompts();

function detectModule(categoria = '') {
  const cat = categoria.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (cat.includes('deporte') || ['futbol', 'beisbol', 'boxeo', 'atletismo', 'torneo'].some(k => cat.includes(k))) return 'DEPORTES';
  if (cat.includes('internacional') || cat.includes('mundo') || cat.includes('global')) return 'INTERNACIONALES';
  if (cat.includes('suceso') || cat.includes('policial') || cat.includes('accidente') || cat.includes('delito') || cat.includes('fallecimiento') || cat.includes('captura') || cat.includes('incendio')) return 'SUCESOS';
  if (cat.includes('espectaculo') || cat.includes('farandula') || cat.includes('cine') || cat.includes('musica') || cat.includes('celebridad') || cat.includes('television')) return 'ESPECTÁCULOS';
  if (cat.includes('tecnologia') || cat.includes('ciencia') || cat.includes('internet') || cat.includes('celular') || cat.includes('aplicacion') || cat.includes('inteligencia artificial')) return 'TECNOLOGÍA';
  return 'NACIONALES NICARAGUA';
}

function buildMENIPrompt(noticia) {
  const modulo = detectModule(noticia.categoria);
  return `${PROMPTS.cerebro}

${PROMPTS.modulos}

==================================================
CONTROL DE CATEGORÍA
==================================================
Categoría detectada: ${noticia.categoria || 'NACIONALES'}
Módulo a activar: ${modulo}

==================================================
NOTICIA DE ENTRADA
==================================================
Título: ${noticia.titulo || '(sin título)'}
Categoría: ${noticia.categoria || ''}
Resumen: ${noticia.resumen || ''}
Contenido: ${stripHtml(noticia.contenido || '')}

==================================================
EJECUCIÓN
==================================================
"Ejecutar MENI v1.1" y entregar el formato final completo.
`;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function callLLM(prompt) {
  if (DRY_RUN) {
    return { ok: true, text: 'DRY_RUN: no se llamó al modelo.', source: 'dry-run' };
  }

  if (LLM_PROVIDER === 'openai') {
    if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY no definida');
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 4000,
      }),
    });
    if (!resp.ok) {
      const err = await resp.text();
      throw new Error(`OpenAI error ${resp.status}: ${err}`);
    }
    const data = await resp.json();
    return { ok: true, text: data.choices[0]?.message?.content || '', source: 'openai' };
  }

  if (LLM_PROVIDER === 'anthropic') {
    if (!ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY no definida');
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!resp.ok) {
      const err = await resp.text();
      throw new Error(`Anthropic error ${resp.status}: ${err}`);
    }
    const data = await resp.json();
    return { ok: true, text: data.content?.[0]?.text || '', source: 'anthropic' };
  }

  if (LLM_PROVIDER === 'ollama') {
    return callOllama(prompt);
  }

  throw new Error(`Proveedor no soportado: ${LLM_PROVIDER}`);
}

async function callOllama(prompt) {
  const body = JSON.stringify({
    model: OLLAMA_MODEL,
    prompt,
    stream: false,
    options: { temperature: 0.3, num_predict: 4000 },
  });
  const curlBin = process.platform === 'win32' ? 'curl.exe' : 'curl';
  const args = [
    '-s', '-S', '-X', 'POST',
    '--max-time', '1800',
    '--connect-timeout', '1800',
    '-H', 'Content-Type: application/json',
    '-d', '@-',
    `${OLLAMA_BASE_URL}/api/generate`,
  ];
  const opts = {
    input: body,
    maxBuffer: 50 * 1024 * 1024,
    encoding: 'utf8',
    timeout: 30 * 60 * 1000,
    windowsHide: true,
  };
  try {
    const out = execFileSync(curlBin, args, opts);
    const data = JSON.parse(out);
    if (data.error) throw new Error(`Ollama error: ${data.error}`);
    return { ok: true, text: data.response || '', source: 'ollama' };
  } catch (err) {
    if (err.code === 'ENOENT' && curlBin === 'curl.exe') {
      const out = execFileSync('curl', args, opts);
      const data = JSON.parse(out);
      if (data.error) throw new Error(`Ollama error: ${data.error}`);
      return { ok: true, text: data.response || '', source: 'ollama' };
    }
    throw new Error(`Ollama curl failed: ${err.message}`);
  }
}

function parseMENIResult(text) {
  const totalMatch = text.match(/TOTAL\s*[:=]?\s*(\d{1,3})\s*\/\s*100/i);
  const score = totalMatch ? parseInt(totalMatch[1], 10) : 0;
  const titleMatch = text.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : '';
  const slugMatch = text.match(/(?:slug|Slug SEO)[\s:]*`?([^`\r\n]+)/i);
  const slug = slugMatch ? slugMatch[1].trim() : '';
  const approved = score >= APPROVAL_THRESHOLD;
  return { score, approved, title, slug, text };
}

async function ensureDirs() {
  for (const d of [OUTPUT_DIR, join(OUTPUT_DIR, 'approved'), join(OUTPUT_DIR, 'prompts')]) {
    mkdirSync(resolve(process.cwd(), d), { recursive: true });
  }
}

async function main() {
  console.log('Cargando noticias desde Firestore...');
  let query = db.collection('noticias');
  const snapshot = await query.get();
  const noticias = [];
  snapshot.forEach((doc) => {
    noticias.push({ id: doc.id, ...doc.data() });
  });

  if (BATCH_LIMIT > 0) noticias.splice(BATCH_LIMIT);

  console.log(`Noticias cargadas: ${noticias.length}`);
  await ensureDirs();

  const results = [];
  let approvedCount = 0;
  let rejectedCount = 0;
  let errorCount = 0;

  for (let i = 0; i < noticias.length; i++) {
    const noticia = noticias[i];
    const modulo = detectModule(noticia.categoria);
    const prompt = buildMENIPrompt(noticia);

    if (DRY_RUN) {
      const promptPath = join(OUTPUT_DIR, 'prompts', `${noticia.id}.md`);
      writeFileSync(resolve(process.cwd(), promptPath), prompt);
      results.push({ id: noticia.id, slug: noticia.slug, categoria: noticia.categoria, modulo, status: 'prompt_generado' });
      console.log(`[${i + 1}/${noticias.length}] prompt generado: ${noticia.id}`);
      continue;
    }

    try {
      const { text } = await callLLM(prompt);
      const parsed = parseMENIResult(text);
      const item = {
        id: noticia.id,
        slug: noticia.slug || parsed.slug || noticia.id,
        categoria: noticia.categoria,
        modulo,
        score: parsed.score,
        approved: parsed.approved,
        title: parsed.title,
      };

      if (parsed.approved) {
        const safeSlug = (noticia.slug || parsed.slug || noticia.id).toString().replace(/[^a-z0-9_-]/gi, '_');
        const filePath = join(OUTPUT_DIR, 'approved', `${safeSlug}.md`);
        writeFileSync(resolve(process.cwd(), filePath), text);
        approvedCount++;
        item.status = 'aprobado';
      } else {
        rejectedCount++;
        item.status = 'rechazado';
      }

      results.push(item);
      console.log(`[${i + 1}/${noticias.length}] ${noticia.id} → score ${parsed.score} → ${item.status}`);
    } catch (err) {
      errorCount++;
      results.push({ id: noticia.id, slug: noticia.slug, categoria: noticia.categoria, modulo, status: 'error', error: err.message });
      console.error(`[${i + 1}/${noticias.length}] ERROR ${noticia.id}: ${err.message}`);
    }

    if (DELAY_MS > 0 && i < noticias.length - 1) await sleep(DELAY_MS);
  }

  const summary = {
    total: noticias.length,
    approved: approvedCount,
    rejected: rejectedCount,
    errors: errorCount,
    dryRun: DRY_RUN,
    provider: DRY_RUN ? 'none' : LLM_PROVIDER,
    threshold: APPROVAL_THRESHOLD,
    results,
  };

  writeFileSync(resolve(process.cwd(), OUTPUT_DIR, 'summary.json'), JSON.stringify(summary, null, 2));

  console.log('\nResumen:');
  console.log(`- Total: ${noticias.length}`);
  console.log(`- Aprobadas: ${approvedCount}`);
  console.log(`- Rechazadas: ${rejectedCount}`);
  console.log(`- Errores: ${errorCount}`);
  if (DRY_RUN) console.log(`- Modo DRY_RUN: prompts guardados en ${OUTPUT_DIR}/prompts`);
  else console.log(`- Notas aprobadas guardadas en ${OUTPUT_DIR}/approved`);
  console.log(`- Detalle en ${OUTPUT_DIR}/summary.json`);
}

main().catch((err) => {
  console.error('Error fatal:', err);
  process.exit(1);
});
