import { readFileSync, writeFileSync } from 'node:fs';
const a = JSON.parse(readFileSync('FORENSIC_ARTICLE_AUTOPSY.json', 'utf8'));
const L = [];
L.push('# AUTOPSIA FORENSE DEL CORPUS — NICARAGUA INFORMATE');
L.push(`Generado: ${a.generado} | Método: ${a.metodo}`);
L.push('');
L.push(`Corpus: ${a.corpus.total} docs | publicados: ${a.corpus.publicados} | despublicados: ${a.corpus.despublicados} | archivados: ${a.corpus.archivados}`);
L.push('');
L.push('## MATRIZ EJECUTIVA');
L.push('');
L.push('| Clase | Cantidad |');
L.push('|---|---|');
L.push(`| 🟢 A — CONSERVAR | ${a.matriz.A_conservar} |`);
L.push(`| 🟡 B — PULIR | ${a.matriz.B_pulir} |`);
L.push(`| 🟠 C — REVISIÓN EDITORIAL | ${a.matriz.C_revision} |`);
L.push(`| 🔴 D — DEFECTUOSOS | ${a.matriz.D_defectuosos} |`);
L.push(`| ⚫ E — CANDIDATOS A RETIRAR | ${a.matriz.E_retirar} |`);
L.push('');
L.push('| Métrica | Valor |');
L.push('|---|---|');
for (const [k, v] of Object.entries(a.matriz)) L.push(`| ${k} | ${v} |`);
L.push('');
L.push('## ⚫ E — CANDIDATOS A RETIRAR (lista para aprobación, NO ejecutar)');
L.push('');
for (const f of a.fichas.filter((x) => x.clase === 'E')) {
  L.push(`### ${f.slug}`);
  L.push(`- URL: ${f.url}`);
  L.push(`- Fecha: ${f.fecha} | Categoría: ${f.categoria} | Autor: ${f.autor} | Palabras: ${f.palabras}`);
  L.push(`- scoreMeni: ${f.scoreMeni} (el auditor le dio ${f.scoreMeni} a un artículo con ${f.parrafosDuplicadosInternos} párrafos repetidos — falso positivo del auditor)`);
  L.push(`- Evidencia: ${f.señales.map((s) => s.c + ' — ' + s.e).join(' ; ')}`);
  L.push(`- Acción propuesta: ${f.accion}`);
  L.push(`- Confianza: ${f.confianza}`);
  L.push('');
}
L.push('## 🔴 D — CONTENIDO DEFECTUOSO (expedientes)');
L.push('');
for (const f of a.fichas.filter((x) => x.clase === 'D')) {
  L.push(`### ${f.slug}`);
  L.push(`- URL: ${f.url}`);
  L.push(`- Fecha: ${f.fecha} | Categoría: ${f.categoria} | Autor: ${f.autor} | Palabras: ${f.palabras} | scoreMeni: ${f.scoreMeni} | noindex: ${f.noindex} | fuente: ${f.nivelFuente} (${f.fuentesIdentificables.join(', ') || 'ninguna identificable'})`);
  L.push(`- Título registrado: "${f.titulo}"`);
  for (const s of f.señales) L.push(`- ${s.c} [${s.conf}]: ${s.e}`);
  L.push(`- Acción: ${f.accion}`);
  L.push('');
}
L.push('## 🟠 C — REVISIÓN EDITORIAL (lista)');
L.push('');
for (const f of a.fichas.filter((x) => x.clase === 'C')) {
  L.push(`- ${f.slug} | ${f.categoria} | ${f.señales.map((s) => s.c).join(', ')}`);
}
L.push('');
L.push('## 🟡 B — PULIR (lista resumida por patrón)');
L.push('');
const bPat = {};
for (const f of a.fichas.filter((x) => x.clase === 'B')) for (const s of f.señales) bPat[s.c] = (bPat[s.c] || 0) + 1;
for (const [k, v] of Object.entries(bPat).sort((a, b) => b[1] - a[1])) L.push(`- ${k}: ${v} artículos`);
L.push('');
writeFileSync('FORENSIC_ARTICLE_AUTOPSY.md', L.join('\n'));
console.log('escrito FORENSIC_ARTICLE_AUTOPSY.md —', L.length, 'líneas');
