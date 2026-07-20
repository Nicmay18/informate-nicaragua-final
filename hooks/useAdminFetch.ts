'use client';

import { useCallback } from 'react';

/**
 * Hook para hacer fetch autenticado a endpoints /api/admin/*
 * Usa el token guardado en localStorage por panel.html
 */
export function useAdminFetch() {
  const adminFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_api_key') || '' : '';
    
    const headers = new Headers(options.headers);
    headers.set('x-admin-token', token);
    
    return fetch(url, { ...options, headers });
  }, []);

  return { adminFetch };
}

/**
 * Obtiene el token de admin de localStorage
 */
export function getAdminToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('admin_api_key') || '';
}
