const fetch = require('node-fetch');

async function checkIds() {
  const resp = await fetch('https://nicaraguainformate.com/api/list-all');
  const data = await resp.json();
  const titles = ["Madres", "Palo de Mayo", "Administrador", "Cerro Negro", "motociclistas mueren", "Ébola"];
  
  const matches = data.articles.filter(a => titles.some(t => a.titulo.includes(t)));
  
  matches.forEach(m => {
    console.log(`ID: "${m.id}" | Titulo: ${m.titulo}`);
  });
}

checkIds();
