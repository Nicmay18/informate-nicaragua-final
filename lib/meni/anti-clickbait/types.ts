/**
 * Anti Clickbait Engine — Types
 * =============================
 * MENI v7: No solo revisa palabras. Analiza INTENCIÓN.
 *
 * Detecta curiosidad artificial vs. información genuina.
 * Funciona PRE-LLM: valida el título antes de que el LLM escriba.
 */

export type ClickbaitVerdict = 'aprobado' | 'bloqueado' | 'advertencia';

export interface ClickbaitSignal {
  patron: string;
  tipo: 'curiosidad_artificial' | 'omision_clave' | 'sensacionalismo' | 'promesa_vacia' | 'teaser';
  descripcion: string;
  severidad: 'alta' | 'media';
}

export interface AntiClickbaitResult {
  veredicto: ClickbaitVerdict;
  score: number;
  tituloAnalizado: string;
  signals: ClickbaitSignal[];
  razon: string;
  tituloSugerido?: string;
}

export interface AntiClickbaitInput {
  titulo: string;
  contenido?: string;
}
