import fs from 'fs';
const html = fs.readFileSync('.audit/home.html', 'utf8');
const cats = {};
const regex = /\\"categoria\\":\\"([^\\"]+)\\"/g;
let m;
while ((m = regex.exec(html)) !== null) {
  const cat = m[1];
  cats[cat] = (cats[cat] || 0) + 1;
}
const total = Object.values(cats).reduce((a, b) => a + b, 0);
const result = { total, categories: cats, percentages: Object.fromEntries(Object.entries(cats).map(([k, v]) => [k, ((v / total) * 100).toFixed(1) + '%'])) };
fs.writeFileSync('.audit/home-distribution.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
