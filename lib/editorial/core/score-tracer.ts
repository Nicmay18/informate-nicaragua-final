import type { ScoreTrace, ScoreTraceEntry } from './types';

export class ScoreTracer {
  private modulo: string;
  private startScore: number;
  private current: number;
  private entries: ScoreTraceEntry[] = [];

  constructor(modulo: string, startScore = 100) {
    this.modulo = modulo;
    this.startScore = startScore;
    this.current = startScore;
  }

  start(score: number, motivo: string): void {
    this.startScore = score;
    this.current = score;
    this.entries.push({
      modulo: this.modulo,
      regla: 'START',
      motivo,
      delta: 0,
      before: score,
      after: score,
    });
  }

  sub(delta: number, motivo: string, regla = 'PENALTY'): void {
    if (delta <= 0) return;
    const before = this.current;
    this.current = Math.max(0, this.current - delta);
    this.entries.push({
      modulo: this.modulo,
      regla,
      motivo,
      delta: -delta,
      before,
      after: this.current,
    });
  }

  getScore(): number {
    return this.current;
  }

  getTrace(): ScoreTrace {
    return {
      modulo: this.modulo,
      start: this.startScore,
      end: this.current,
      entries: this.entries,
    };
  }
}
