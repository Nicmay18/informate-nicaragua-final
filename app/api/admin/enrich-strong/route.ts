import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export const revalidate = 0;
export const maxDuration = 30;

function verificarAuth(request: NextRequest): boolean {
  const token = request.headers.get('x-admin-token') || request.headers.get('x-admin-key') || '';
  const validTokens = [process.env.ADMIN_API_KEY, process.env.CRON_SECRET].filter(Boolean) as string[];
  return validTokens.length > 0 && validTokens.includes(token);
}

interface EnrichStrongRequest {
  noticiaId?: string;
  modo?: 'noticia' | 'masivo';
}

// Stopwords en español
const STOPWORDS = new Set([
  'el','la','los','las','un','una','unos','unas','y','o','pero','sin','con','de','del','al','en','por','para','a','ante','bajo','contra','desde','hacia','hasta','segun','según','sobre','tras','durante','mediante','excepto','entre','como','que','quien','quienes','cuyo','cuyos','cuya','cuyas','donde','cuando','cual','cuales','cuyo','esto','eso','aquel','aqui','alli','alla','ya','no','si','ni','tambien','tan','tanto','mucho','muchos','poco','pocos','todo','todos','nada','nadie','alguien','alguno','alguna','algunos','algunas','ninguno','ninguna','otro','otra','otros','otras','mismo','misma','mismos','mismas','tal','tales','cual','cuales','cuyo','cuyos','cuya','cuyas','uno','una','dos','tres','primero','primera','segundo','segunda','tercero','ultimo','ultima','pasado','pasada','proximo','proxima','actual','nuevo','nueva','nuevos','nuevas','antiguo','antigua','antiguos','antiguas','gran','grande','grandes','mayor','mayores','menor','menores','mejor','mejores','peor','peores','anterior','posterior','igual','diferente','varios','varias','ambos','ambas','cada','cualquier','sendos','sendas','mio','mia','mios','mias','tuyo','tuya','tuyos','tuyas','suyo','suya','suyos','suyas','nuestro','nuestra','nuestros','nuestras','vuestro','vuestra','vuestros','vuestras','aun','aún','sino','luego','ademas','asimismo','igualmente','mientras','mientras','antes','despues','pronto','tarde','temprano','ya','todavia','aun','siempre','nunca','jamás','jam','casi','quizas','quizás','acaso','talvez','quiza','quiz','cómo','como','cual','donde','cuando','porque','pues','puesto','asi','entonces','luego','después','después','seguido','enseguida','inmediatamente','ahora','hoy','ayer','mañana','anteayer','pasado','todavia','aun','aún','ya','no','ni','tampoco','nunca','jam','jamás','si','sí','tambien','tampoco','o','u','ya','sea','bien','mal','mas','menos','más','menos','muy','mucho','poco','bastante','demasiado','casi','apenas','solamente','solo','unicamente','justo','exactamente','aproximadamente','cerca','lejos','delante','detras','arriba','abajo','encima','debajo','dentro','fuera','adentro','afuera','acá','allí','ahi','aca','alla','all','aquí','ahi','ahi','alli','donde','adonde','hacia','desde','hasta','según','conforme','durante','mediante','salvo','excepto','incluso','menos','mas','ademas','tambien','inclusive','especialmente','particularmente','generalmente','normalmente','usualmente','frecuentemente','a','menudo','raramente','general','particular','especial','comun','corriente','ordinario','normal','natural','logico','logica','posible','probable','necesario','necesaria','imposible','improbable','seguro','segura','cierto','cierta','verdadero','verdadera','falso','falsa','real','efectivo','efectiva','positivo','positiva','negativo','negativa','absoluto','absoluta','relativo','relativa','total','completo','completa','entero','entera','plen','plena','puro','pura','impuro','impura','limpio','limpia','sucio','sucia','claro','clara','oscuro','oscura','dificil','facil','complicado','complicada','sencillo','sencilla','simple','doble','triple','unico','unica','solo','sol','mult','var','múltiple','diverso','diversa','cierto','cierta','tal','determinado','determinada','indeterminado','indeterminada','concreto','concreta','abstracto','abstracta','fisico','fisica','material','espiritual','moral','etico','estetico','teorico','teorica','practico','practica','aplicado','aplicada','experimental','empirico','empirica','cientifico','cientifica','artistico','artistico','artística','literario','literaria','musical','plastico','plastica','visual','auditivo','auditiva','tactil','olfativo','gustativo','sens','sensorial','emocional','afectivo','afectiva','cognitivo','cognitiva','volitivo','volitiva','consciente','inconsciente','subconsciente','razonable','irracional','logico','logica','coherente','incoherente','consistente','inconsistente','sistematico','sistematica','metodico','metodica','organizado','organizada','desorganizado','desorganizada','planificado','planificada','improvisado','improvisada','preparado','preparada','imprevisto','imprevista','inesperado','inesperada','previsto','prevista','esperado','esperada','anticipado','anticipada','tard','tempran','inop','oportun','extemporane','intempestiv','impropi','indebid','ilegal','legal','licit','lic','permit','prohib','obligator','opcional','facultat','voluntari','forzos','coercit','libre','esclav','independiente','dependiente','autonom','autonom','subordin','domin','sometid','sujet','vincul','lig','lig','atad','desat','libertad','servid','oblig','deud','credit','favor','contrafavor','benefici','perjudic','gananci','perd','victori','derrot','triunf','fracas','exit','fall','acert','err','aciert','error','acierto','equivoc','aciert','errores','falt','defect','exces','sobr','falt','carenc','abundanci','escas','copi','much','muchedumbre','multitud','monton','pila','grup','multitud','gent','gentio','aluvion','avalanch','torrent','ri','corrient','mar','océano','golf','ol','marea','corrient','fluj','reflu','entr','salid','subid','baj','alz','baj','crecimient','decrecimient','aument','disminu','increment','decrement','ampli','reduc','extens','comprens','intens','debil','fuert','débil','fort','fragil','resistent','solid','firm','establ','inestabl','insegur','segur','seguridad','inseguridad','confianz','desconfianz','certez','incertidumbr','dud','indud','sospech','recel','recel','desconfi','malici','malici','mald','pervers','perversidad','corrupt','corrupcion','honest','honestidad','integridad','probid','probit','moral','inmoral','amoral','etico','etica','deontolog','deontologic','principi','valor','virtud','vicio','cualid','defect','merit','demerit','merec','merecimient','just','injust','justici','injustici','equidad','inequidad','igual','desigual','equilibr','desequilibr','establ','inestabl','armoni','disonanci','consonanci','discordanci','concordanci','conform','disconform','acord','desacord','coincid','diferenci','divergenci','convergenci','opuest','contrari','antagonic','conflict','paz','guerr','calm','torment','turbulenci','serenid','tranquil','agit','inquietud','quietud','repos','descans','fatig','cansanci','energ','vital','vigor','debil','debilidad','potenci','impotenci','capac','incapac','habil','destrez','torp','torpez','ingenu','astuci','astuci','astut','taim','taimad','picar','picard','pill','pill','bribon','bribonz','ladron','ladronzuel','timador','estafador','delincuent','criminal','malhechor','culp','inocent','responsable','irresponsable','culpabilidad','inocenci','sospechos','imput','acus','denunc','querell','querella','pleit','litigi','proces','caus','asunt','cas','hech','suced','acontec','ocurr','pas','event','circunstanci','situacion','condicion','estad','moment','period','etap','fass','tiemp','cronologi','cronologic','temporal','atemporal','espaci','localiz','ubic','posicion','lugar','sitio','punt','zon','region','area','sector','territori','domini','rein','nacion','pais','estad','provinci','departament','cant','distrit','municipi','comarc','parroqui','barri','coloni','urbaniz','ciud','puebl','vill','aldead','lugare','lugar','local','hac','fund','ranch','plant','factor','cent','instal','edific','construccion','obra','proyect','plan','program','planificacion','proyecto','proyeccion','prevision','pronost','pronostic','predic','vaticin','adivin','presagi','aguer','auguri','prognost','diagnostic','diagnostic','analisis','estudi','investigacion','pesquis','indag','averigu','comprob','verific','constat','certific','acredit','atest','testific','testimon','declar','manifest','expres','indic','señal','señal','senal','marc','rast','huel','indici','evidenci','prueb','demostr','demostracion','confirm','refut','refutacion','argument','argumentacion','razon','razonamient','logic','logica','il','ilic','leg','ileg','licit','ilicit','permit','prohib','autoriz','desautoriz','habilit','inhabilit','capacit','incapacit','calific','calificacion','competent','incompetent','idone','inidone','apt','inapt','prepar','preparacion','form','formacion','instruccion','educacion','enseñ','docenci','pedagogi','didact','metodologi','metod','metod','tecnic','tecnic','praxis','practica','ejercici','ejercit','entren','prepar','preparacion','deport','deport','jueg','deport','competenci','rivalidad','competit','competitividad','deportividad','olimp','olimpic','olimpica','camp','campion','campeona','subcampeona','semifinal','final','cuart','octav','eliminatori','clasificatori','ascens','descens','promocion','relegacion',
]);

function extraerKeywords(titulo: string, contenido: string): string[] {
  const keywords: string[] = [];

  // 1. Palabras del título (largas, no stopwords)
  const tituloWords = titulo
    .replace(/<[^>]+>/g, '')
    .split(/\s+/)
    .map(w => w.replace(/[^a-záéíóúñA-ZÁÉÍÓÚÑ]/g, ''))
    .filter(w => w.length > 4 && !STOPWORDS.has(w.toLowerCase()));

  keywords.push(...tituloWords.slice(0, 5));

  // 2. Nombres propios detectados (palabras capitalizadas en el contenido)
  const capitalized = contenido
    .replace(/<[^>]+>/g, ' ')
    .match(/\b[A-ZÁÉÍÓÚÑ][a-záéíóúñ]{3,}\b/g) || [];

  const freq: Record<string, number> = {};
  capitalized.forEach(w => {
    const lower = w.toLowerCase();
    if (!STOPWORDS.has(lower) && lower.length > 4) {
      freq[lower] = (freq[lower] || 0) + 1;
    }
  });

  // Tomar las más frecuentes
  const topCapitalized = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([w]) => w);

  keywords.push(...topCapitalized);

  // 3. Bigramas del título (frases de 2 palabras)
  const cleanTitle = titulo.replace(/<[^>]+>/g, '').split(/\s+/).filter(Boolean);
  for (let i = 0; i < cleanTitle.length - 1; i++) {
    const bigram = cleanTitle.slice(i, i + 2).join(' ');
    const cleanBigram = bigram.replace(/[^a-záéíóúñA-ZÁÉÍÓÚÑ\s]/g, '');
    if (cleanBigram.length > 8) keywords.push(cleanBigram);
  }

  // Eliminar duplicados y limitar
  return [...new Set(keywords)].slice(0, 15);
}

function enriquecerConStrong(contenido: string, keywords: string[]): { nuevo: string; agregados: number } {
  let nuevo = contenido;
  let agregados = 0;
  const maxAgregados = 18;

  // Contar cuántos <strong> ya hay
  const strongsExistentes = (contenido.match(/<strong>/gi) || []).length;
  if (strongsExistentes >= 15) {
    return { nuevo, agregados: 0 };
  }

  const faltan = maxAgregados - strongsExistentes;

  for (const kw of keywords) {
    if (agregados >= faltan) break;

    // Escapar para regex
    const escapada = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Buscar la palabra/frase que NO esté ya dentro de <strong>...</strong>
    // Patrón: la palabra que no esté precedida por <strong> ni seguida de </strong>
    const regex = new RegExp(`(?<!<strong[^>]*>)(?<!</strong>\\s*<strong>)(?<!</strong>)\\b${escapada}\\b(?![^<]*</strong>)`, 'gi');

    let match;
    while ((match = regex.exec(nuevo)) !== null && agregados < faltan) {
      const idx = match.index;
      const original = match[0];
      // Verificar que no esté dentro de un tag
      const antes = nuevo.substring(0, idx);
      const despues = nuevo.substring(idx + original.length);
      // Doble verificación: no debe estar ya dentro de <strong>
      if (!antes.endsWith('<strong>') && !despues.startsWith('</strong>')) {
        nuevo = antes + '<strong>' + original + '</strong>' + despues;
        agregados++;
        // Resetear regex después de modificar string
        regex.lastIndex = idx + ('<strong>' + original + '</strong>').length;
      }
    }
  }

  return { nuevo, agregados };
}

export async function POST(request: NextRequest) {
  if (!verificarAuth(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  try {
    const body: EnrichStrongRequest = await request.json();
    const { noticiaId, modo = 'noticia' } = body;

    const db = getAdminDb();

    if (modo === 'noticia' && noticiaId) {
      const docRef = db.collection('noticias').doc(noticiaId);
      const doc = await docRef.get();
      if (!doc.exists) {
        return NextResponse.json({ error: 'Noticia no encontrada' }, { status: 404 });
      }

      const data = doc.data()!;
      const contenido = data.contenido || '';
      const titulo = data.titulo || '';

      const keywords = extraerKeywords(titulo, contenido);
      const { nuevo, agregados } = enriquecerConStrong(contenido, keywords);

      if (agregados === 0) {
        return NextResponse.json({ success: true, message: 'Ya tiene suficientes <strong>', skipped: true });
      }

      await docRef.update({
        contenido: nuevo,
        fechaActualizacion: new Date(),
      });

      return NextResponse.json({
        success: true,
        message: `${agregados} negritas agregadas`,
        agregados,
      });
    }

    if (modo === 'masivo') {
      const snapshot = await db.collection('noticias').get();
      let procesadas = 0;
      let saltadas = 0;
      let totalAgregados = 0;
      let errores = 0;

      for (const doc of snapshot.docs) {
        const data = doc.data();
        const contenido = data.contenido || '';
        const titulo = data.titulo || '';

        const strongsExistentes = (contenido.match(/<strong>/gi) || []).length;
        if (strongsExistentes >= 15) {
          saltadas++;
          continue;
        }

        try {
          const keywords = extraerKeywords(titulo, contenido);
          const { nuevo, agregados } = enriquecerConStrong(contenido, keywords);

          if (agregados === 0) {
            saltadas++;
            continue;
          }

          await db.collection('noticias').doc(doc.id).update({
            contenido: nuevo,
            fechaActualizacion: new Date(),
          });

          procesadas++;
          totalAgregados += agregados;
        } catch (e) {
          errores++;
          console.error(`Error en doc ${doc.id}:`, e);
        }
      }

      return NextResponse.json({
        success: true,
        message: `Proceso masivo: ${procesadas} noticias enriquecidas, ${totalAgregados} negritas agregadas`,
        procesadas,
        saltadas,
        totalAgregados,
        errores,
      });
    }

    return NextResponse.json({ error: 'Modo no válido' }, { status: 400 });

  } catch (error) {
    console.error('Enrich strong error:', error);
    return NextResponse.json(
      { error: 'Error al enriquecer strong', message: (error as Error).message },
      { status: 500 }
    );
  }
}
