/**
 * AUDITORÍA DEPLOY: Compara estructura HTML antes vs después del refactor semántico
 * Fecha: 2025-06-17
 */

const URL_NUEVA = 'https://nicaraguainformate.com/noticias/economia-de-nicaragua-crece-6-y-alcanza-record-en-remesas-mqfw23nk';

async function auditar() {
  console.log('🔍 AUDITORÍA DEPLOY — Nicaragua Informate');
  console.log('=========================================\n');

  try {
    const res = await fetch(URL_NUEVA, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const html = await res.text();

    const checks = [
      { name: '<article itemScope NewsArticle>', regex: /<article[^>]*itemscope[^>]*itemtype="https:\/\/schema\.org\/NewsArticle"/i, antes: '✅', despues: '✅' },
      { name: '<header> dentro de article', regex: /<article[^>]*>[\s\S]*?<header[\s>]/i, antes: '❌ No existía', despues: '✅ NUEVO' },
      { name: '<section itemProp="articleBody">', regex: /<section[^>]*itemprop="articleBody"/i, antes: '❌ Era <div>', despues: '✅ NUEVO' },
      { name: '<footer> para tags', regex: /<\/section>[\s\S]*?<footer[\s>]/i, antes: '❌ Era <div>', despues: '✅ NUEVO' },
      { name: '<aside aria-label="Autor">', regex: /<aside[^>]*aria-label="Autor"/i, antes: '❌ Era <div>', despues: '✅ NUEVO' },
      { name: '<aside aria-label="Lea además">', regex: /<aside[^>]*aria-label="Lea además"/i, antes: '❌ Era <div>', despues: '✅ NUEVO' },
      { name: '<aside aria-label="Lea también">', regex: /<aside[^>]*aria-label="Lea también"/i, antes: '❌ Era <div>', despues: '✅ NUEVO' },
      { name: 'text-wrap: balance en h1', regex: /textWrap.*balance|text-wrap.*balance/i, antes: '❌ No existía', despues: '✅ NUEVO' },
      { name: '<time dateTime> publicación', regex: /<time[^>]*datetime="[^"]+"[^>]*itemprop="datePublished"/i, antes: '✅', despues: '✅' },
      { name: '<time dateTime> modificación', regex: /<time[^>]*datetime="[^"]+"[^>]*itemprop="dateModified"/i, antes: '✅', despues: '✅' },
      { name: '<figure itemProp="image">', regex: /<figure[^>]*itemprop="image"/i, antes: '✅', despues: '✅' },
      { name: 'fetchPriority="high" en img', regex: /fetchpriority="high"/i, antes: '✅', despues: '✅' },
      { name: 'JSON-LD NewsArticle', regex: /<script[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?"@type":"NewsArticle"/i, antes: '✅', despues: '✅' },
      { name: 'Open Graph tags', regex: /<meta[^>]*property="og:/i, antes: '✅', despues: '✅' },
      { name: 'Twitter Card tags', regex: /<meta[^>]*name="twitter:/i, antes: '✅', despues: '✅' },
      { name: 'Canonical link', regex: /<link[^>]*rel="canonical"/i, antes: '✅', despues: '✅' },
      { name: 'AdSense in-article (data-ad-layout)', regex: /data-ad-layout="in-article"/i, antes: '✅', despues: '✅' },
      { name: 'Skip link', regex: /href="#main-content"/i, antes: '✅', despues: '✅' },
      { name: '<main> landmark', regex: /<main[^>]*id="main-content"/i, antes: '✅', despues: '✅' },
    ];

    console.log('Elemento                              | Antes (viej) | Después (nuevo)');
    console.log('--------------------------------------|--------------|----------------');

    let nuevos = 0;
    let yaExistian = 0;

    for (const check of checks) {
      const encontrado = check.regex.test(html);
      const status = encontrado ? '✅ OK' : '❌ FALTA';
      const label = check.name.padEnd(37, ' ');
      const antes = (check.antes || '❌').padEnd(14, ' ');
      const despues = encontrado ? (check.despues || '✅').padEnd(16, ' ') : '❌ FALTA'.padEnd(16, ' ');
      console.log(`${label}| ${antes}| ${despues}`);

      if (check.despues?.includes('NUEVO') && encontrado) nuevos++;
      if (check.despues === '✅' && encontrado) yaExistian++;
    }

    // Métricas extra
    const h2Count = (html.match(/<h2/g) || []).length;
    const pCount = (html.match(/<p/g) || []).length;
    const blockquoteCount = (html.match(/<blockquote/g) || []).length;
    const ulCount = (html.match(/<ul/g) || []).length;
    const imgCount = (html.match(/<img/g) || []).length;
    const htmlSize = (html.length / 1024).toFixed(1);

    console.log('\n--------------------------------------');
    console.log('📊 MÉTRICAS DE CONTENIDO (noticia auditada)');
    console.log('--------------------------------------');
    console.log(`<h2> subtítulos:           ${h2Count}`);
    console.log(`<p> párrafos:             ${pCount}`);
    console.log(`<blockquote> citas:       ${blockquoteCount}`);
    console.log(`<ul> listas:              ${ulCount}`);
    console.log(`<img> imágenes:            ${imgCount}`);
    console.log(`HTML total:               ${htmlSize} KB`);
    console.log(`URL:                      ${URL_NUEVA}`);

    console.log('\n--------------------------------------');
    console.log('📈 RESUMEN DE CAMBIOS');
    console.log('--------------------------------------');
    console.log(`Elementos semánticos NUEVOS agregados: ${nuevos}/6`);
    console.log(`Elementos que ya existían y se mantienen: ${yaExistian}`);
    console.log(`Total verificaciones: ${checks.length}`);

    if (nuevos === 6) {
      console.log('\n🎉 TODOS los elementos semánticos nuevos están presentes.');
    } else {
      console.log('\n⚠️ Algunos elementos nuevos faltan. Revisar cache o deploy.');
    }

    // Guardar reporte
    const reporte = {
      fecha: new Date().toISOString(),
      url: URL_NUEVA,
      htmlSizeKb: parseFloat(htmlSize),
      metricas: { h2: h2Count, p: pCount, blockquote: blockquoteCount, ul: ulCount, img: imgCount },
      resultados: checks.map(c => ({
        elemento: c.name,
        antes: c.antes,
        despues: c.despues,
        encontrado: c.regex.test(html),
      })),
    };

    await Bun.write?.('auditoria-deploy-report.json', JSON.stringify(reporte, null, 2))
      || require('fs').promises.writeFile('auditoria-deploy-report.json', JSON.stringify(reporte, null, 2));

    console.log('\n💾 Reporte guardado en: auditoria-deploy-report.json');

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

auditar();
