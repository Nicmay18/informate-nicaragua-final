export const criticalCss = `
:root{--font-inter:'Inter',system-ui,-apple-system,sans-serif;--font-merri:'Merriweather',Georgia,serif;--ni-primary:#0A192F;--ni-accent:#D4AF37;--ni-surface:#f8fafc}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{font-family:var(--font-inter);-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
body{background:var(--ni-surface);color:#1e293b;line-height:1.6}
a{color:inherit;text-decoration:none}
img{max-width:100%;height:auto;display:block}
.ni-header{position:sticky;top:0;z-index:100;background:var(--ni-primary);height:56px;display:flex;align-items:center;justify-content:space-between;padding:0 16px;box-shadow:0 1px 3px rgba(0,0,0,.15)}
.ni-header__logo{color:#fff;font-family:var(--font-merri);font-weight:900;font-size:1.125rem;letter-spacing:-.02em}
.ni-hero{position:relative;overflow:hidden;height:clamp(360px,55vw,520px);background:#0f172a}
.ni-hero__track{position:relative;height:100%}
.ni-hero__slide{position:absolute;inset:0;opacity:0;transition:opacity .6s ease}
.ni-hero__slide.is-active{opacity:1}
.ni-hero__media{position:absolute;inset:0}
.ni-hero__info{position:absolute;bottom:0;left:0;right:0;padding:20px;background:linear-gradient(transparent 0%,rgba(0,0,0,.85) 100%)}
.ni-hero__badge{display:inline-block;padding:4px 10px;border-radius:4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;background:var(--ni-accent);color:var(--ni-primary)}
.ni-hero__title{font-family:var(--font-merri);font-size:clamp(1.1rem,2.8vw,1.75rem);font-weight:900;color:#fff;line-height:1.25;margin-top:8px}
.ni-hero__lead{font-size:clamp(.8125rem,1.8vw,.9375rem);color:#cbd5e1;margin-top:6px;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.ni-hero__meta{font-size:11px;color:#94a3b8;margin-top:10px}
.ni-grid{display:grid;grid-template-columns:1fr;gap:16px;padding:16px;max-width:1280px;margin:0 auto}
@media(min-width:1024px){.ni-grid{grid-template-columns:minmax(0,2fr) minmax(0,1fr);gap:24px;padding:24px}}
.ni-marquee-bar{background:#dc2626;color:#fff;height:40px;display:flex;align-items:center;overflow:hidden;font-size:13px;font-weight:600}
.ni-marquee-bar__badge{background:#b91c1c;padding:0 16px;height:100%;display:flex;align-items:center;white-space:nowrap;font-size:12px;text-transform:uppercase}
.ni-marquee-bar__content{flex:1;overflow:hidden;mask-image:linear-gradient(90deg,transparent,#000 10%,#000 90%,transparent)}
.ni-marquee-bar__scroll{display:flex;gap:32px;animation:marquee 30s linear infinite;white-space:nowrap;padding-left:16px}
@keyframes marquee{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
`;
