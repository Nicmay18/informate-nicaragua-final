import { NextResponse } from 'next/server';

export function isString(v: unknown): v is string {
  return typeof v === 'string';
}

export function isNumber(v: unknown): v is number {
  return typeof v === 'number' && !isNaN(v);
}

export function isBoolean(v: unknown): v is boolean {
  return typeof v === 'boolean';
}

export function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === 'string');
}

export function clampString(value: unknown, fallback: string, max = 500): string {
  const s = isString(value) ? value.trim() : fallback;
  return s.slice(0, max);
}

export function clampInt(value: unknown, fallback: number, min: number, max: number): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n < min || n > max) return fallback;
  return n;
}

export function parseJsonBody(raw: unknown): { ok: true; data: Record<string, unknown> } | { ok: false; response: NextResponse } {
  if (!isObject(raw)) {
    return { ok: false, response: NextResponse.json({ error: 'Body inválido' }, { status: 400 }) };
  }
  return { ok: true, data: raw };
}

export function rejectUnknownKeys(data: Record<string, unknown>, allowed: string[]): string[] {
  return Object.keys(data).filter((k) => !allowed.includes(k));
}
