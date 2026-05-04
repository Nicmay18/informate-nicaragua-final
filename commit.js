const { execSync } = require('child_process');
const path = require('path');

const projectPath = 'E:\\PROYECTO\\informate-nicaragua-main';

try {
  process.chdir(projectPath);
  
  console.log('Agregando archivos...');
  execSync('git add public/index.html public/noticia.html', { stdio: 'inherit' });
  
  console.log('Haciendo commit...');
  execSync('git commit -m "fix: carousel object-fit contain y mejorar noticias relacionadas"', { stdio: 'inherit' });
  
  console.log('Haciendo push...');
  execSync('git push', { stdio: 'inherit' });
  
  console.log('¡Éxito!');
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
