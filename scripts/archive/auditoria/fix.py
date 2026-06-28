import re  
f=open('next.config.ts','r',encoding='utf-8')  
c=f.read()  
f.close()  
c=c.replace('    unoptimized: true,\n    remotePatterns','    remotePatterns')  
open('next.config.ts','w',encoding='utf-8').write(c)  
print('done')  
