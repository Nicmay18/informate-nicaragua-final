'use client';

import { useEffect } from 'react';

/**
 * Temas válidos para la aplicación
 */
const VALID_THEMES = ['light', 'dark'] as const;
type ValidTheme = typeof VALID_THEMES[number];

/**
 * Valida si un tema es válido
 * @param theme Tema a validar
 * @returns true si el tema es válido
 */
function isValidTheme(theme: string): theme is ValidTheme {
  return VALID_THEMES.includes(theme as ValidTheme);
}

/**
 * Componente de inicialización de tema
 * Lee el tema guardado en localStorage o usa la preferencia del sistema
 */
export function ThemeInit() {
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ni_theme');
      
      if (saved && isValidTheme(saved)) {
        document.documentElement.setAttribute('data-theme', saved);
      } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
        document.documentElement.setAttribute('data-theme', 'light');
      } else {
        document.documentElement.setAttribute('data-theme', 'dark');
      }
    } catch (error) {
      console.error('[ThemeInit]', error instanceof Error ? error.message : String(error));
    }
  }, []);

  return null;
}
