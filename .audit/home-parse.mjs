import fs from 'fs';
const html = await (await fetch('http://localhost:3000/')).text();
fs.writeFileSync('.audit/home.html', html);
console.log('saved', html.length);
