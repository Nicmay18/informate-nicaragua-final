const urls = ['http://localhost:3000/contacto','http://localhost:3000/privacidad','http://localhost:3000/politica-editorial'];
for (const u of urls) {
  const h = await (await fetch(u)).text();
  const title = h.match(/<title>([\s\S]*?)<\/title>/i)?.[1].replace(/\s+/g, ' ').trim();
  const og = h.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i)?.[1];
  const tw = h.match(/<meta[^>]+name="twitter:title"[^>]+content="([^"]+)"/i)?.[1];
  console.log(u);
  console.log('  title:', title);
  console.log('  og:', og);
  console.log('  tw:', tw);
}
