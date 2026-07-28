/**
 * Verificación post-LLM — ¿Se cumplieron las decisiones editoriales?
 * =================================================================
 * Después de que el LLM redacta, esta función verifica que el texto
 * cumpla con lo que el Editor en Jefe decidió.
 *
 * Si dijo "debe explicar la ley" → verifica que la explicó.
 * Si dijo "debe aportar prevención" → verifica que existe.
 * Si dijo "debe diferenciarse" → verifica que lo hizo.
 */

import type { EditorialVerification, EditorialVerificationItem, EditorialDecision } from './types';

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
}

function containsAny(text: string, terms: string[]): boolean {
  return terms.some(term => text.includes(term.toLowerCase()));
}

export function verifyEditorialDecisions(
  decision: EditorialDecision,
  articuloCompleto: string,
): EditorialVerification {
  const texto = stripHtml(articuloCompleto);
  const items: EditorialVerificationItem[] = [];
  const instr = decision.llmInstructions;

  // 1. Verificar explicaciones obligatorias
  for (const explicacion of instr.explicacionesObligatorias) {
    // Extraer palabras clave de la explicación (antes del →)
    const clave = explicacion.split('→')[0].trim().toLowerCase();
    const palabrasClave = clave.split(/\s+/).filter(w => w.length > 4).slice(0, 3);
    const cumplido = palabrasClave.length > 0
      ? containsAny(texto, palabrasClave)
      : texto.includes(clave);
    items.push({
      requisito: explicacion,
      tipo: 'explicacion',
      cumplido,
      evidencia: cumplido ? `Encontrado en el texto` : 'No encontrado en el texto generado',
    });
  }

  // 2. Verificar contexto necesario
  for (const contexto of instr.contextoNecesario) {
    const palabrasClave = contexto.toLowerCase().split(/\s+/).filter(w => w.length > 4).slice(0, 3);
    const cumplido = palabrasClave.length > 0 && containsAny(texto, palabrasClave);
    items.push({
      requisito: contexto,
      tipo: 'contexto',
      cumplido,
      evidencia: cumplido ? 'Contexto presente' : 'Contexto ausente',
    });
  }

  // 3. Verificar explicaciones de servicio (desde Story Planner)
  for (const servicio of decision.storyPlan.explicacionesServicio) {
    const palabrasClave = servicio.toLowerCase().split(/\s+/).filter(w => w.length > 4).slice(0, 3);
    const cumplido = palabrasClave.length > 0 && containsAny(texto, palabrasClave);
    items.push({
      requisito: servicio,
      tipo: 'servicio',
      cumplido,
      evidencia: cumplido ? 'Servicio incluido' : 'Servicio no encontrado',
    });
  }

  // 4. Verificar preguntas obligatorias respondidas
  for (const pregunta of instr.preguntasAResponder) {
    const palabrasClave = pregunta.toLowerCase()
      .replace(/[¿?¡!]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 4)
      .slice(0, 3);
    const cumplido = palabrasClave.length > 0 && containsAny(texto, palabrasClave);
    items.push({
      requisito: pregunta,
      tipo: 'pregunta',
      cumplido,
      evidencia: cumplido ? 'Pregunta abordada' : 'Pregunta no abordada',
    });
  }

  // 5. Verificar diferenciación editorial
  const elementosDiferenciales = decision.editorialDifference.elementosDiferenciales;
  if (elementosDiferenciales.length > 0) {
    const cumplidos = elementosDiferenciales.filter(el => {
      const palabras = el.toLowerCase().split(/\s+/).filter(w => w.length > 4).slice(0, 3);
      return palabras.length > 0 && containsAny(texto, palabras);
    });
    items.push({
      requisito: `Diferenciación editorial (${elementosDiferenciales.length} elementos)`,
      tipo: 'diferenciacion',
      cumplido: cumplidos.length >= Math.ceil(elementosDiferenciales.length * 0.5),
      evidencia: `${cumplidos.length}/${elementosDiferenciales.length} elementos presentes`,
    });
  }

  // 6. Verificar sello editorial NI
  if (decision.nicaraguaInformate.selloEditorial) {
    const sello = decision.nicaraguaInformate.selloEditorial;
    const palabrasClave = sello.toLowerCase().split(/\s+/).filter(w => w.length > 4).slice(0, 3);
    const cumplido = palabrasClave.length > 0 && containsAny(texto, palabrasClave);
    items.push({
      requisito: `Sello editorial NI: ${sello}`,
      tipo: 'diferenciacion',
      cumplido,
      evidencia: cumplido ? 'Sello editorial presente' : 'Sello editorial ausente',
    });
  }

  const totalRequisitos = items.length;
  const cumplidos = items.filter(i => i.cumplido).length;
  const incumplidos = totalRequisitos - cumplidos;
  const pasa = incumplidos === 0 || (totalRequisitos > 0 && cumplidos / totalRequisitos >= 0.7);

  const detalles = `${cumplidos}/${totalRequisitos} requisitos editoriales cumplidos. ${
    pasa
      ? 'Las decisiones editoriales se reflejan en el artículo.'
      : `${incumplidos} requisitos editoriales no se cumplieron en el texto generado.`
  }`;

  return {
    items,
    totalRequisitos,
    cumplidos,
    incumplidos,
    pasa,
    detalles,
  };
}
