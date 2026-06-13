import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup después de cada test
afterEach(() => {
  cleanup();
});

// ─── Mock de variables de entorno ──────────────────────────────
process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'test-key';
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'test-project';

// ─── Mock de Firebase (opcional) ───────────────────────────────
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
  getApp: vi.fn(() => ({})),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  getDocs: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  updateDoc: vi.fn(),
  setDoc: vi.fn(),
  deleteDoc: vi.fn(),
  writeBatch: vi.fn(),
}));

// ─── Configurar console para tests ─────────────────────────────
const originalLog = console.log;
const originalError = console.error;

console.log = vi.fn((...args: any[]) => {
  // Filtrar logs de testing
  if (!String(args[0]).includes('[')) {
    originalLog(...args);
  }
});

console.error = vi.fn((...args: any[]) => {
  // Solo mostrar errores reales
  if (!String(args[0]).includes('act()')) {
    originalError(...args);
  }
});
