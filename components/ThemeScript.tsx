'use client';

export default function ThemeScript() {
  return (
    <script
      defer
      suppressHydrationWarning
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            try {
              var saved = localStorage.getItem('ni_theme');
              var theme = (saved === 'light' || saved === 'dark') ? saved : 'light';
              document.documentElement.setAttribute('data-theme', theme);
            } catch (e) {}
          })();
        `,
      }}
    />
  );
}
