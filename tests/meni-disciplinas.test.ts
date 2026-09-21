import { describe, it, expect } from 'vitest';
import { classifySports, selectSportsQuestions } from '@/lib/meni/sports-classifier';
import { runReaderQuestionsEngine } from '@/lib/meni/editorial-brain/reader-questions-engine';
import { runEditorialBrain } from '@/lib/meni/editorial-brain';
import type { EditorialBrainInput } from '@/lib/meni/editorial-brain/types';
import { deportesProfile } from '@/lib/meni/editorial-brain/profiles/deportes';

const FUTBOL_QUESTIONS = ['jugaron', 'tabla', 'próximo partido', 'proximo partido', 'figuras destacadas'];

function input(overrides: Partial<EditorialBrainInput>): EditorialBrainInput {
  return {
    titulo: '',
    contenido: '',
    resumen: '',
    categoria: 'Deportes',
    perfil: 'deportes',
    ...overrides,
  } as EditorialBrainInput;
}

function textoPreguntas(d: ReturnType<typeof runReaderQuestionsEngine>): string {
  return d.preguntasObligatorias.join(' ').toLowerCase();
}

const MOTOCROSS_PREVIA = input({
  titulo: 'Campeonato Nacional de Motocross disputará su séptima fecha en Managua',
  resumen: 'La séptima fecha del Campeonato Nacional de Motocross se realizará este domingo en la pista del Parque Nacional de Ferias.',
  contenido:
    'La séptima fecha del Campeonato Nacional de Motocross se realizará este domingo en la pista del Parque Nacional de Ferias, en Managua. ' +
    'Según la organización, competirán pilotos de las categorías 50cc, 65cc, 85cc y MX1. ' +
    'El campeonato contempla varias fechas durante el año. La entrada será gratuita.',
});

const FUTBOL_POSTERIOR = input({
  titulo: 'Real Estelí vence 2-1 a Managua FC y mantiene el liderato',
  resumen: 'Real Estelí ganó el partido contra Managua FC en el estadio Independencia.',
  contenido:
    'Real Estelí venció 2-1 a Managua FC este domingo en el estadio Independencia. ' +
    'El equipo norteño ganó el partido con goles en el segundo tiempo y mantiene el liderato de la tabla de posiciones con 32 puntos.',
});

const BEISBOL_POSTERIOR = input({
  titulo: 'Nicaragua gana la serie ante Panamá en el béisbol internacional',
  resumen: 'La selección de béisbol de Nicaragua ganó la serie ante Panamá.',
  contenido:
    'La selección de béisbol de Nicaragua ganó la serie ante Panamá tras vencer en el último juego. ' +
    'El lanzador nicaragüense ponchó a ocho bateadores y el equipo anotó cinco carreras.',
});

const BOXEO_PREVIA = input({
  titulo: 'Boxeador nicaragüense peleará por el título regional este sábado',
  resumen: 'El boxeador nicaragüense disputará el título regional este sábado en Managua.',
  contenido:
    'El boxeador nicaragüense peleará este sábado en la cartelera principal del gimnasio Polideportivo. ' +
    'La pelea será en peso ligero y el título regional está en disputa.',
});

const ATLETISMO_POSTERIOR = input({
  titulo: 'Nicaragua gana oro en relevos mixtos 4x100 en Managua',
  resumen: 'El equipo de atletismo de Nicaragua ganó la medalla de oro en relevos 4x100.',
  contenido:
    'El equipo de atletismo de Nicaragua ganó la medalla de oro en los relevos mixtos 4x100 metros este domingo en Managua. ' +
    'Los velocistas nicaragüenses lograron la mejor marca de la competencia.',
});

const AUTOMOVILISMO = input({
  titulo: 'Campeonato de 1/4 de Milla: adrenalina y técnica en Managua',
  resumen: 'Más de 140 pilotos compitieron en la cuarta fecha del campeonato de arrancones.',
  contenido:
    'Más de 140 pilotos compitieron en la cuarta fecha del Campeonato Nacional de 1/4 de Milla en Managua. ' +
    'Los autos alcanzaron altas velocidades en la pista habilitada para las arrancones.',
});

describe('MENI — clasificación de disciplinas deportivas', () => {
  it('motocross: detecta disciplina motocross y etapa previa', () => {
    const c = classifySports(MOTOCROSS_PREVIA.titulo!, MOTOCROSS_PREVIA.contenido!, MOTOCROSS_PREVIA.resumen);
    expect(c.disciplina).toBe('motocross');
    expect(c.etapa).toBe('previa');
  });

  it('motocross previa: NO genera preguntas de fútbol', () => {
    const d = runReaderQuestionsEngine(MOTOCROSS_PREVIA);
    const t = textoPreguntas(d);
    for (const q of FUTBOL_QUESTIONS) expect(t).not.toContain(q);
    // las de fútbol quedan registradas como no aplicables, no exigidas
    expect(d.preguntasNoAplicables!.join(' ').toLowerCase()).toContain('jugaron');
    expect(d.clasificacionDeporte?.disciplina).toBe('motocross');
  });

  it('motocross previa: genera preguntas pertinentes (fecha, categorías, participantes)', () => {
    const d = runReaderQuestionsEngine(MOTOCROSS_PREVIA);
    const t = textoPreguntas(d);
    expect(t).toMatch(/fecha del campeonato|categorias|competiran|disputa/);
    // previa: no exige resultado ni ganador
    expect(t).not.toContain('ganaron');
    expect(t).not.toContain('resultado');
  });

  it('fútbol posterior: mantiene preguntas de fútbol pertinentes', () => {
    const d = runReaderQuestionsEngine(FUTBOL_POSTERIOR);
    const t = textoPreguntas(d);
    expect(d.clasificacionDeporte?.disciplina).toBe('futbol');
    expect(t).toContain('resultado');
    expect(t).toContain('jugaron');
    expect(t).toContain('tabla'); // el texto menciona tabla/liderato → estructura aplica
  });

  it('béisbol: pregunta por serie/juego, no por partido de fútbol', () => {
    const d = runReaderQuestionsEngine(BEISBOL_POSTERIOR);
    const t = textoPreguntas(d);
    expect(d.clasificacionDeporte?.disciplina).toBe('beisbol');
    expect(t).toMatch(/serie|juego|carreras/);
    expect(t).not.toContain('proximo partido');
  });

  it('boxeo previa: pelea/cartelera/peso, no resultado', () => {
    const d = runReaderQuestionsEngine(BOXEO_PREVIA);
    const t = textoPreguntas(d);
    expect(d.clasificacionDeporte?.disciplina).toBe('boxeo');
    expect(d.clasificacionDeporte?.etapa).toBe('previa');
    expect(t).toMatch(/pelea|cartelera|peso|titulo/);
    expect(t).not.toContain('gano la pelea');
  });

  it('automovilismo: disciplina motor, preguntas de carrera/categorías', () => {
    const d = runReaderQuestionsEngine(AUTOMOVILISMO);
    const t = textoPreguntas(d);
    expect(d.clasificacionDeporte?.disciplina).toBe('automovilismo');
    expect(t).toMatch(/carrera|categoria|posiciones|fecha/);
    for (const q of FUTBOL_QUESTIONS) expect(t).not.toContain(q);
  });

  it('atletismo: disciplina individual, sin preguntas de equipo', () => {
    const d = runReaderQuestionsEngine(ATLETISMO_POSTERIOR);
    const t = textoPreguntas(d);
    expect(d.clasificacionDeporte?.disciplina).toBe('atletismo');
    expect(t).toMatch(/resultado|marca|medalla|prueba/);
    expect(t).not.toContain('tabla');
    expect(t).not.toContain('jugaron');
  });

  it('disciplina desconocida: no_determinada → preguntas genéricas seguras', () => {
    const d = runReaderQuestionsEngine(input({
      titulo: 'Evento deportivo regional se realizará en Managua',
      contenido: 'Un evento deportivo regional se realizará el próximo mes en Managua con participación de varios departamentos.',
    }));
    expect(d.clasificacionDeporte?.disciplina).toBe('no_determinada');
    const t = textoPreguntas(d);
    for (const q of FUTBOL_QUESTIONS) expect(t).not.toContain(q);
    expect(t).toMatch(/disciplina|evento|participan/);
  });

  it('NO_APLICABLE no penaliza: motocross previa no pierde puntos por preguntas de fútbol', () => {
    const d = runReaderQuestionsEngine(MOTOCROSS_PREVIA);
    // todas las obligatorias son aplicables; ninguna no_aplicable está en obligatorias
    for (const p of d.preguntasNoAplicables || []) {
      expect(d.preguntasObligatorias).not.toContain(p);
    }
    // y su estado queda marcado
    const na = d.preguntas.filter(p => p.aplicabilidad === 'no_aplicable');
    expect(na.length).toBeGreaterThan(0);
    expect(na.every(p => !p.obligatoria)).toBe(true);
  });

  it('LLM no recibe preguntas de fútbol para motocross (preguntasAResponder)', () => {
    const decision = runEditorialBrain(MOTOCROSS_PREVIA);
    const llm = decision.llmInstructions.preguntasAResponder.join(' ').toLowerCase();
    for (const q of FUTBOL_QUESTIONS) expect(llm).not.toContain(q);
    // contexto del journey tampoco lleva fútbol
    const ctx = decision.llmInstructions.contextoNecesario.join(' ').toLowerCase();
    expect(ctx).not.toContain('quiénes jugaron');
    expect(ctx).not.toContain('quienes jugaron');
  });

  it('estructura no inventada: previa de motocross sin "campeonato" no exige número de fechas', () => {
    const d = runReaderQuestionsEngine(input({
      titulo: 'Pilotos de motocross entrenan en nueva pista de Managua',
      contenido: 'Un grupo de pilotos de motocross entrenará este fin de semana en una nueva pista habilitada en Managua. La actividad reunirá a pilotos de distintas edades.',
    }));
    const t = textoPreguntas(d);
    expect(t).not.toContain('cuantas fechas contempla el campeonato');
  });

  it('categoría no deportiva no pasa por el clasificador de disciplinas', () => {
    const d = runReaderQuestionsEngine(input({
      categoria: 'Nacionales',
      perfil: 'nacionales',
      titulo: 'Gobierno anuncia nuevo programa de becas',
      contenido: 'El gobierno de Nicaragua anunció un nuevo programa de becas para estudiantes universitarios.',
    }));
    expect(d.clasificacionDeporte).toBeUndefined();
    expect(d.preguntasObligatorias.length).toBeGreaterThan(0);
  });
});
