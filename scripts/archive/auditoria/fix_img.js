const fs=require('fs'); let c=fs.readFileSync('temp_config.ts','utf8'); c=c.replace('  images: {', '  images: {\n    unoptimized: true,'); fs.writeFileSync('next.config.ts',c); console.log('done');  
