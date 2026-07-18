import type { DebugTrace, ScoreTraceEntry } from './types';

let idCounter = 0;

export class ScoreTracer {
  private score = 0;
  private entries: ScoreTraceEntry[] = [];

  constructor(
    private source: string,
    private modulo: string,
  ) {}

  start(initial: number, motivo: string): void {
    this.score = initial;
    this.push(0, 'start', motivo, 'INICIO');
  }

  add(delta: number, motivo: string, rule: string, scoreAfter?: number): void {
    const after = scoreAfter ?? this.score + delta;
    this.push(after - this.score, 'add', motivo, rule);
  }

  sub(delta: number, motivo: string, rule: string, scoreAfter?: number): void {
    const after = scoreAfter ?? Math.max(0, this.score - delta);
    this.push(after - this.score, 'sub', motivo, rule);
  }

  set(score: number, motivo: string, rule: string): void {
    this.push(score - this.score, 'set', motivo, rule);
  }

  floor(score: number, motivo: string, rule: string): void {
    if (this.score < score) {
      this.push(score - this.score, 'floor', motivo, rule);
    }
  }

  ceil(score: number, motivo: string, rule: string): void {
    if (this.score > score) {
      this.push(score - this.score, 'ceiling', motivo, rule);
    }
  }

  getScore(): number {
    return this.score;
  }

  getTrace(): DebugTrace {
    return {
      scoreInicial: this.entries[0]?.scoreAfter ?? 0,
      scoreFinal: this.score,
      entries: this.entries,
    };
  }

  getEntries(): ScoreTraceEntry[] {
    return this.entries;
  }

  private push(
    delta: number,
    tipo: ScoreTraceEntry['tipo'],
    motivo: string,
    rule: string,
  ): void {
    this.score += delta;
    idCounter += 1;
    this.entries.push({
      id: `st-${idCounter}`,
      tipo,
      source: this.source,
      modulo: this.modulo,
      rule,
      motivo,
      delta,
      scoreAfter: this.score,
    });
  }
}
