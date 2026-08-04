import { describe, it } from 'vitest';
import { computeContextScore } from '@/lib/meni/contextualiza';
import { detectContentProfile } from '@/lib/meni/profile-detector';

const notaAudit = {
  titulo: 'Mujer fue asesinada presuntamente por su expareja en Managua',
  resumen: 'Una mujer de 28 años fue encontrada sin vida en su vivienda de Managua. La policía investiga el femicidio y busca a su expareja.',
  contenido: `
    <p>Una mujer de 28 años fue encontrada sin vida en su vivienda ubicada en el barrio Riguero de Managua en horas de la madrugada.</p>
    <p>Según versiones preliminares, la víctima mantenía una relación conflictiva con su expareja, quien habría ingresado a la vivienda horas antes del hecho.</p>
    <p>La Policía Nacional confirmó que investigan el caso como un femicidio y que ya iniciaron la búsqueda del principal sospechoso.</p>
    <p>Vecinos del sector indicaron que escucharon discusiones minutos antes de que se escucharan los hechos. La víctima deja dos menores de edad.</p>
    <p>La Fiscalía de Managua ordenó el levantamiento del cuerpo y la realización de la autopsia correspondiente. Hasta el momento no se ha confirmado la identidad del agresor.</p>
    <p>Este caso se suma a otros eventos de violencia contra mujer registrados en los últimos meses en la capital. Las autoridades no entregaron más detalles.</p>
    <h2>¿Qué se sabe hasta ahora?</h2>
    <p>El cuerpo fue hallado por familiares que acudieron a la vivienda después de intentar comunicarse sin éxito con la víctima.</p>
    <p>Las investigaciones continúan y la policía solicita a testigos que aporten información para ubicar al presunto responsable.</p>
  `.trim(),
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
