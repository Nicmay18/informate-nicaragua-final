import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    // ─── Environment ───────────────────────────────────────────
    environment: 'jsdom',
    globals: true,
    
    // ─── Coverage ──────────────────────────────────────────────
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}', 'lib/**/*.{ts,tsx}', 'app/**/*.{ts,tsx}'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.ts',
        '**/types.ts',
        '**/.next/**',
      ],
      lines: 70,
      functions: 70,
      branches: 70,
      statements: 70,
    },

    // ─── Setup Files ───────────────────────────────────────────
    setupFiles: ['./tests/setup.ts'],

    // ─── Test Files Pattern ────────────────────────────────────
    include: ['tests/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],

    // ─── Mocking ───────────────────────────────────────────────
    mockReset: true,
    restoreMocks: true,
    clearMocks: true,

    // ─── Reporter ──────────────────────────────────────────────
    reporters: ['verbose'],

    // ─── Performance ───────────────────────────────────────────
    testTimeout: 10000,
    hookTimeout: 10000,

    // ─── Snapshot ──────────────────────────────────────────────
    snapshotFormat: {
      printBasicPrototype: false,
    },
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@/lib': path.resolve(__dirname, './lib'),
      '@/app': path.resolve(__dirname, './app'),
      '@/components': path.resolve(__dirname, './components'),
      '@/public': path.resolve(__dirname, './public'),
    },
  },
});
