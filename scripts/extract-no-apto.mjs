import { readFileSync, writeFileSync } from 'fs';

const md = readFileSync('g:\\RESPALDO\\informate-nicaragua-worktree\\adsense-audit-report.md', 'utf8');
const lines = md.split('\n');
const noAptos = [];
let current = null;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.startsWith('## ')) {
    current = { titulo: line.replace('## ', '').replace(/^[\s!?⚠️❌✅]+\s*/, '').trim() };
  }
  if (current && line.includes('**Slug:**')) {
    const m = line.match(/`(.+?)`/);
    if (m) current.slug = m[1];
  }
  if (current && line.includes('**Estado:** NO APTO')) {
    current.estado = 'NO APTO';
  }
  if (current && line.includes('**Palabras estimadas:**')) {
    const m = line.match(/\*\*Palabras estimadas:\*\*\s*(\d+)/);
    if (m) current.palabras = m[1];
  }
  if (current && line.includes('**Score:**')) {
    const m = line.match(/\*\*Score:\*\*\s*(\d+)/);
    if (m) current.score = m[1];
  }
  if (current && current.estado === 'NO APTO' && line.startsWith('- **Problemas:**')) {
    noAptos.push({ ...current });
    current = null;
  }
}

console.log('TOTAL NO APTO: ' + noAptos.length);
noAptos.forEach((a, i) => {
  console.log((i + 1) + '. ' + a.titulo + ' | ' + a.slug + ' | ' + a.palabras + ' palabras | Score ' + a.score + '%');
});

writeFileSync('g:\\RESPALDO\\informate-nicaragua-worktree\\adsense-no-apto.json', JSON.stringify(noAptos, null, 2), 'utf8');
console.log('\nGuardado en adsense-no-apto.json');
