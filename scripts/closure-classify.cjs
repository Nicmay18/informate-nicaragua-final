const fs = require('fs');
const snap = JSON.parse(fs.readFileSync('CLOSURE_SNAPSHOT.json', 'utf8'));
const arts = snap.articles;
const out = { timestamp: new Date().toISOString(), total: arts.length, summary: {}, classifications: [] };

for (const a of arts) {
  let cls = 'KEEP', reasons = [], dupOf = null;
  const tx = (a.contenido || '').replace(/<[^>]+>/g, ' ').toLowerCase();
  const wc = a.palabras || tx.split(/\s+/).filter(w => w.length).length;

  // Duplicate check
  for (const o of arts) {
    if (o.id === a.id || !o.titulo) continue;
    const n1 = a.titulo.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
    const n2 = o.titulo.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
    if (n1 === n2) { dupOf = o.id; break; }
    const w1 = new Set(n1.split(/\s+/)), w2 = new Set(n2.split(/\s+/));
    const u = new Set([...w1, ...w2]);
    if ([...w1].filter(x => w2.has(x)).length / u.size > 0.85) { dupOf = o.id; break; }
  }
  if (dupOf) { cls = 'DELETE'; reasons.push('Duplicado de ' + dupOf); }
  else if (!a.contenido || tx.trim().length < 50) { cls = 'DELETE'; reasons.push('Contenido vacío'); }
  else {
    // Obsolescence
    if (a.fecha) {
      const days = (new Date() - new Date(a.fecha)) / 864e5;
      const tt = (a.titulo + ' ' + a.contenido).toLowerCase();
      if (['convocatoria', 'inscripciones abiertas', 'se realizará', 'próximo', 'se aproxima'].some(k => tt.includes(k)) && days > 30) { cls = 'ARCHIVE'; reasons.push('Obsoleto: evento vencido'); }
      else if (['previa', 'preview', 'lo que viene', 'se avecina'].some(k => tt.includes(k)) && days > 14) { cls = 'ARCHIVE'; reasons.push('Preview pasado'); }
      else if ((tt.includes('copa 2026') || tt.includes('mundial 2026')) && days > 30 && !tt.includes('resultado')) { cls = 'ARCHIVE'; reasons.push('Copa 2026 obsoleto'); }
    }
    if (cls === 'KEEP') {
      // HTML issues
      const html = [];
      if (/<p>\s*<\/p>/i.test(a.contenido)) html.push('empty_p');
      if (!/<h2/i.test(a.contenido)) html.push('no_h2');
      if (/<script/i.test(a.contenido)) html.push('script');
      if (html.length) { cls = 'TECHNICAL_FIX'; reasons.push('HTML: ' + html.join(',')); }
      // Low words
      if (wc > 0 && wc < 200) { if (cls === 'KEEP') cls = 'ENRICH'; reasons.push('Palabras: ' + wc); }
      // Transcription
      const sig = ['comunicado', 'en comunicado', 'boletín'].filter(s => tx.includes(s)).length;
      const inst = ['tiene el agrado de', 'se complace en', 'hace de conocimiento', 'informa a la población', 'en el marco de'].filter(p => tx.includes(p)).length;
      if (sig >= 2 || inst >= 3) { if (cls !== 'TECHNICAL_FIX') cls = 'REWRITE'; reasons.push('Transcripción'); }
      // MENI rejected
      if (a.aprobadoMeni === false && a.estado !== 'archivado') {
        if (a.scoreMeni !== null && a.scoreMeni < 70) { cls = 'ARCHIVE'; reasons.push('MENI bajo: ' + a.scoreMeni); }
        else if (a.scoreMeni !== null && a.scoreMeni < 90) { if (cls === 'KEEP') cls = 'ENRICH'; reasons.push('MENI rechazado: ' + a.scoreMeni); }
      }
      // Empty resumen
      if (!a.resumen || a.resumen.trim() === '' || a.resumen === a.titulo) { if (cls === 'KEEP') cls = 'TECHNICAL_FIX'; reasons.push('Resumen问题'); }
    }
  }

  if (!reasons.length) { cls = 'KEEP'; reasons.push('OK'); }
  out.summary[cls] = (out.summary[cls] || 0) + 1;
  out.classifications.push({ id: a.id, titulo: (a.titulo || '').substring(0, 80), slug: a.slug, categoria: a.categoria, perfil: a.perfil, scoreMeni: a.scoreMeni, aprobadoMeni: a.aprobadoMeni, publicado: a.publicado, estado: a.estado, palabras: wc, fecha: a.fecha, classification: cls, reasons, duplicateOf: dupOf });
}

fs.writeFileSync('CLOSURE_CLASSIFICATION.json', JSON.stringify(out, null, 2));
console.log('Total:', out.total);
console.log('Summary:', JSON.stringify(out.summary, null, 2));
