import { describe, it } from 'vitest';
import { computeContextScore } from '@/lib/meni/contextualiza';
import { detectContentProfile } from '@/lib/meni/profile-detector';

const notaAudit = {
  titulo: 'Dos casos de violencia contra mujeres en Boaco y Chontales',
  resumen: 'La Policía investiga dos hechos de violencia contra mujeres en Boaco y Chontales, ocurridos el fin de semana con un patrón similar.',
  contenido: `<p>Dos hechos de violencia contra mujeres, con un aparente mismo patrón, ocurrieron entre el sábado y el domingo en los departamentos de <strong>Boaco y Chontales</strong>, y son investigados por la Policía Nacional. Los casos dejaron como saldo <strong>una mujer fallecida, otra gravemente herida y dos hombres muertos</strong>, en hechos que apuntan a un mismo desenlace: los presuntos agresores habrían atentado contra sus propias vidas después de los ataques.</p>

<h2>Boaco: mujer atacada tras negarse a retomar la relación</h2>

<p>La tarde del sábado, <strong>Guissell Quiroz Sequeira, de 34 años</strong>, fue atacada con un cuchillo por su expareja, <strong>Jenaro Antonio Dávila Mejía, de 45 años</strong>, en la comarca Jocote, municipio de San Lorenzo, Boaco. De acuerdo con la información preliminar, el hombre la habría agredido luego de que ella se negara a retomar la relación sentimental. Tras herirla en el abdomen, Dávila Mejía se provocó una lesión con un machete y falleció en el lugar.</p>

<p>Quiroz fue auxiliada por personal de asistencia médica y trasladada al <strong>Hospital Primario Ahmed Campos Corea</strong>, en San Lorenzo, donde recibió atención médica. El caso apunta, de forma preliminar, a un <strong>presunto femicidio en grado de frustración</strong> seguido del suicidio del agresor, aunque las autoridades no han emitido un informe oficial sobre las causas del hecho.</p>

<h2>Chontales: pareja encontrada sin vida en una cuartería</h2>

<p>Un día después, la tarde del domingo, fueron encontrados sin vida <strong>Freddy Martínez y Juvelkis Ojeda</strong> en una cuartería del municipio de La Libertad, Chontales. De manera extraoficial, una de las hipótesis señala que el hombre habría dado muerte a la mujer y posteriormente se quitó la vida; sin embargo, la Policía Nacional continúa las investigaciones para determinar cómo ocurrieron los hechos, en un caso que permanece bajo estudio para establecer si se trató de un presunto femicidio seguido de suicidio.</p>

<h2>Entender el patrón: el ciclo de la violencia</h2>

<p>Especialistas en violencia doméstica describen un patrón recurrente conocido como el <strong>ciclo de la violencia</strong>, que ayuda a explicar por qué muchas víctimas permanecen o intentan alejarse de una relación abusiva antes de que ocurra un episodio grave. El ciclo suele incluir una fase de <strong>acumulación de tensión</strong> (discusiones, control, celos), seguida de un <strong>episodio de agresión</strong>, y después una fase de <strong>arrepentimiento o reconciliación</strong> del agresor, que puede llevar a la víctima a retomar la relación. Cuando la víctima decide romper este ciclo de forma definitiva, como intentó hacer Guissell Quiroz en Boaco, ese momento de ruptura es, según especialistas, uno de los de mayor riesgo, porque el agresor pierde el control que ejercía sobre la relación.</p>

<h2>Un patrón que se repite en distintos departamentos</h2>

<p>Casos como los de Boaco y Chontales comparten características que las Comisarías de la Mujer y la Niñez documentan de forma recurrente a nivel nacional: una relación de pareja o expareja, un momento de ruptura o rechazo por parte de la víctima, y una escalada de violencia que culmina con el agresor atentando contra su propia vida tras el ataque. Este patrón no se limita a un departamento en particular; las Comisarías de la Mujer y la Niñez operan en las principales cabeceras departamentales del país precisamente para dar respuesta a este tipo de casos, que las autoridades investigan bajo el marco de la Ley 779.</p>

<h2>Marco legal: qué establece la Ley 779</h2>

<p>En Nicaragua, los casos de violencia contra la mujer se investigan bajo la <strong>Ley 779, Ley Integral contra la Violencia hacia las Mujeres</strong>, que reconoce esta violencia como un problema de salud pública y de seguridad ciudadana. Según la propia ley, corresponde a las <strong>Comisarías de la Mujer y la Niñez</strong>, a nivel departamental, distrital o municipal, elaborar el expediente investigativo de este tipo de casos y remitirlo a las autoridades correspondientes; en los municipios donde no existen estas comisarías, el informe queda a cargo del jefe policial de la zona.</p>

<h2>Señales de alerta: cuándo buscar ayuda</h2>

<p>Organizaciones especializadas en violencia doméstica coinciden en que ciertos comportamientos suelen preceder a un episodio de violencia física grave: control excesivo sobre las decisiones de la pareja, celos intensos, aislamiento de familiares y amistades, amenazas directas o veladas, y un historial de agresiones previas que se intensifican con el tiempo. Las Comisarías de la Mujer y la Niñez recomiendan que, ante cualquiera de estas señales, la persona en riesgo busque acompañamiento antes de que la situación escale.</p>

<h2>Investigaciones en curso</h2>

<p>En ninguno de los dos casos hay personas detenidas, ya que los presuntos agresores fallecieron en el lugar de los hechos. Las autoridades no han brindado información oficial sobre las causas de ambas tragedias y mantienen abiertas las investigaciones en los dos departamentos.</p>

<p><em>Si usted o alguien que conoce está viviendo una situación de violencia, puede acudir a la Comisaría de la Mujer y la Niñez más cercana o llamar al número de emergencia de la Policía Nacional, 118.</em></p>`,
};

function printAudit() {
  const p = detectContentProfile(notaAudit.titulo, notaAudit.contenido, notaAudit.resumen);
  const c = computeContextScore(notaAudit.titulo, notaAudit.contenido, notaAudit.resumen, p.profile_detected);
  const labels: Record<string, string> = {
    antecedentes: 'Antecedentes',
    marco_legal: 'Marco legal',
    datos_verificables: 'Datos verificables',
    contexto_temporal: 'Contexto temporal',
    contexto_geografico: 'Contexto geográfico',
    instituciones: 'Instituciones',
    impacto_social: 'Impacto social',
    fuentes: 'Fuentes',
  };
  console.log(`Perfil detectado: ${p.profile_detected} (confianza ${(p.profile_confidence * 100).toFixed(0)}%)`);
  console.log('');
  let total = 0;
  for (const [k, v] of Object.entries(c)) {
    const label = labels[k] || k;
    const pad = '.'.repeat(Math.max(0, 30 - label.length));
    console.log(`${label} ${pad} ${v.score}/${v.maximo}`);
    console.log(`  evidencia encontrada: ${v.encontrado.join(', ') || '(ninguna)'}`);
    console.log(`  evidencia faltante: ${v.faltante.join(', ') || '(ninguna)'}`);
    console.log(`  regla aplicada: detector de coincidencias semánticas (signals) para ${k}`);
    console.log(`  archivo y línea: lib/meni/contextualiza.ts:107-188 (definición), lib/meni/contextualiza.ts:211-225 (cálculo)`);
    total += v.score;
  }
  const max = Object.values(c).reduce((s, v) => s + v.maximo, 0);
  console.log('');
  console.log(`TOTAL contextualiza: ${total}/${max} = ${(total / max * 100).toFixed(1)}%`);
}

describe('AUDITORIA CONTEXT SCORE', () => {
  it('imprime desglose', () => {
    printAudit();
    expect(true).toBe(true);
  });
});
