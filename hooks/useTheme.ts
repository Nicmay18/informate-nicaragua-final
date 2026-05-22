"use client";

import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('light');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Get theme from localStorage or system preference
    const getInitialTheme = (): Theme => {
      if (typeof window === 'undefined') return 'light';
      
      const savedTheme = localStorage.getItem('ni_theme') as Theme;
      if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
        return savedTheme;
      }
      
      // Check system preference
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
      
      return 'light';
    };

    const initialTheme = getInitialTheme();
    setTheme(initialTheme);
    setIsLoaded(true);
    
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', initialTheme);
    document.documentElement.classList.toggle('dark', initialTheme === 'dark');
  }, []);

  useEffect(() => {
    // Listen for system theme changes
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      const savedTheme = localStorage.getItem('ni_theme');
      if (!savedTheme) {
        const newTheme = e.matches ? 'dark' : 'light';
        setTheme(newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    
    // Save to localStorage
    localStorage.setItem('ni_theme', newTheme);
    
    // Apply to document
    document.documentElement.setAttribute('data-theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    
    // Dispatch custom event for other components
    window.dispatchEvent(new CustomEvent('themeChange', { detail: newTheme }));
  };

  const setThemeMode = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('ni_theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    window.dispatchEvent(new CustomEvent('themeChange', { detail: newTheme }));
  };

  return {
    theme,
    toggleTheme,
    setTheme: setThemeMode,
    isLoaded,
    isDark: theme === 'dark',
    isLight: theme === 'light'
  };
}