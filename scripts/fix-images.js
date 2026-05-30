const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function fix() {
  const publicDir = path.resolve(__dirname, '../public');

  // 1. logo.png 124KB → logo.webp ~12KB
  await sharp(path.join(publicDir, 'logo.png'))
    .resize(512, 512, { fit: 'inside' })
    .webp({ quality: 85 })
    .toFile(path.join(publicDir, 'logo.webp'));

  // 2. icon-192x192.png → icon-192x192.webp
  await sharp(path.join(publicDir, 'logo.png'))
    .resize(192, 192, { fit: 'inside' })
    .webp({ quality: 85 })
    .toFile(path.join(publicDir, 'icon-192x192.webp'));

  // 3. favicon.ico real multi-res
  const buf32 = await sharp(path.join(publicDir, 'logo.png'))
    .resize(32, 32, { fit: 'inside' })
    .png()
    .toBuffer();
  const buf16 = await sharp(path.join(publicDir, 'logo.png'))
    .resize(16, 16, { fit: 'inside' })
    .png()
    .toBuffer();

  // Crear ICO simple (header + 2 images)
  const icoHeader = Buffer.alloc(6);
  icoHeader.writeUInt16LE(0, 0); // reserved
  icoHeader.writeUInt16LE(1, 2); // type: icon
  icoHeader.writeUInt16LE(2, 4); // count: 2 images

  const dirEntry = (size, offset, len) => {
    const b = Buffer.alloc(16);
    b.writeUInt8(size === 256 ? 0 : size, 0); // width
    b.writeUInt8(size === 256 ? 0 : size, 1); // height
    b.writeUInt8(0, 2); // colors
    b.writeUInt8(0, 3); // reserved
    b.writeUInt16LE(1, 4); // planes
    b.writeUInt16LE(32, 6); // bpp
    b.writeUInt32LE(len, 8); // size
    b.writeUInt32LE(offset, 12); // offset
    return b;
  };

  const offset1 = 6 + 16 * 2;
  const offset2 = offset1 + buf16.length;
  const icoData = Buffer.concat([
    icoHeader,
    dirEntry(16, offset1, buf16.length),
    dirEntry(32, offset2, buf32.length),
    buf16,
    buf32,
  ]);

  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoData);

  const logoSize = fs.statSync(path.join(publicDir, 'logo.webp')).size;
  const favSize = fs.statSync(path.join(publicDir, 'favicon.ico')).size;
  console.log(`logo.webp: ${(logoSize/1024).toFixed(1)} KB`);
  console.log(`favicon.ico: ${(favSize/1024).toFixed(1)} KB`);
  console.log('OK');
}

fix().catch(err => { console.error(err); process.exit(1); });
