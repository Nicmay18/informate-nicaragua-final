const fs = require('fs');
const t = fs.readFileSync('.env.local', 'utf8');
for (const l of t.split(/\r?\n/)) {
  const m = l.match(/^([A-Z_]+)\s*=\s*(.*)$/);
  if (!m) continue;
  const v = m[2].replace(/^["']|["']$/g, '').trim();
  if (/ADMIN|CRON|TOKEN|SECRET|KEY/i.test(m[1])) {
    console.log(m[1], '| len:', v.length, '| empty:', v === '');
  }
}
