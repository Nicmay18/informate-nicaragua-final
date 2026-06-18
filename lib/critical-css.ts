export const criticalCss = `
.ni-header{position:sticky;top:0;z-index:100;box-shadow:0 2px 8px rgba(0,0,0,0.08)}
.ni-header__top{background:#fff;border-bottom:1px solid #e2e8f0;max-width:1200px;margin:0 auto;padding:0 20px;height:60px;display:flex;align-items:center;justify-content:space-between}
.ni-logo{display:flex;align-items:center;gap:10px;font-family:'Merriweather',serif;font-weight:900;color:#0f172a}
.ni-logo__img{width:42px;height:42px;border-radius:50%;object-fit:cover;flex-shrink:0;border:2px solid #e2e8f0}
.ni-logo__text{display:flex;flex-direction:column;line-height:1.2}
.ni-logo__text strong{font-size:1.1rem;letter-spacing:-0.01em;color:#0f172a}
.ni-logo__tagline{font-family:'Inter',sans-serif;font-size:0.55rem;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#64748b;margin-top:1px}
.ni-header__nav{background:#0f172a}
.ni-nav{max-width:1200px;margin:0 auto;padding:0 20px;display:flex;gap:0;list-style:none;height:40px;align-items:center}
.ni-nav li{height:100%;display:flex;align-items:center}
.ni-nav a{display:flex;align-items:center;height:100%;padding:0 16px;font-size:0.78rem;font-weight:600;text-transform:uppercase;letter-spacing:0.03em;color:rgba(255,255,255,0.85);transition:color 0.2s,border-color 0.2s;position:relative;border-bottom:2px solid transparent}
.ni-hero{position:relative;max-width:1200px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:auto auto;margin-top:24px;margin-bottom:24px;padding:0 20px;gap:0}
.ni-hero__track{position:relative;grid-column:2;grid-row:1/3;border-radius:0 12px 12px 0;overflow:hidden;min-height:400px;background:#e2e8f0}
.ni-hero__slide{position:absolute;inset:0;opacity:0;transition:opacity 0.7s ease;pointer-events:none;z-index:1}
.ni-hero__slide.is-active{opacity:1;pointer-events:auto;z-index:2}
.ni-hero__media{position:absolute;inset:0}
.ni-hero__media img{width:100%;height:100%;object-fit:cover;object-position:center center}
.ni-hero__info{grid-column:1;grid-row:1;background:#0f172a;border-radius:12px 0 0 0;padding:40px 36px;display:flex;flex-direction:column;justify-content:center}
.ni-hero__badge{display:inline-block;padding:4px 10px;border-radius:3px;font-size:0.65rem;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;color:#fff;margin-bottom:16px;width:fit-content}
.ni-hero__title{font-family:'Merriweather',serif;font-size:1.9rem;font-weight:900;line-height:1.22;color:#fff;margin-bottom:14px;letter-spacing:-0.02em}
.ni-hero__lead{font-size:0.92rem;line-height:1.6;color:rgba(255,255,255,0.75);margin-bottom:16px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.ni-hero__meta{font-size:0.78rem;color:rgba(255,255,255,0.5);display:flex;gap:8px;align-items:center}
.ni-hero__indicators{grid-column:1/3;grid-row:2;display:grid;grid-template-columns:repeat(5,1fr);background:#1e293b;border-radius:0 0 12px 12px;overflow:hidden;position:relative;z-index:5}
.ni-content{max-width:1200px;margin:0 auto;padding:0 20px;display:grid;grid-template-columns:1fr 300px;gap:24px}
.ni-main{min-width:0}
.ni-section{margin-bottom:32px}
.ni-section__header{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;padding-bottom:8px;border-bottom:2px solid #e2e8f0}
.ni-section__title{font-size:0.95rem;font-weight:800;text-transform:uppercase;letter-spacing:0.04em;color:#0f172a}
.ni-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.ni-card{background:#fff;border-radius:10px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 1px 3px rgba(0,0,0,0.04);transition:transform 0.2s ease,box-shadow 0.2s ease;display:flex;flex-direction:column;height:100%}
.ni-card:hover{transform:translateY(-4px);box-shadow:0 8px 24px rgba(0,0,0,0.08)}
.ni-card__thumb{position:relative;width:100%;aspect-ratio:16/9;overflow:hidden;background:#e2e8f0}
.ni-card__thumb img{width:100%;height:100%;object-fit:cover;object-position:center;transition:transform 0.3s ease}
.ni-card:hover .ni-card__thumb img{transform:scale(1.04)}
.ni-card__body{padding:14px 16px;display:flex;flex-direction:column;flex:1}
.ni-card__cat{font-size:0.62rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#64748b;margin-bottom:6px}
.ni-card__title{font-family:'Merriweather',serif;font-size:0.92rem;font-weight:700;line-height:1.35;color:#0f172a;margin-bottom:8px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.ni-card__meta{font-size:0.72rem;color:#94a3b8;display:flex;gap:8px;align-items:center;margin-top:auto}
.ni-sidebar{min-width:0}
.ni-sidebar__widget{background:#fff;border-radius:10px;border:1px solid #e2e8f0;padding:16px;margin-bottom:16px}
.ni-footer{background:#0f172a;color:#cbd5e1;padding:40px 20px;margin-top:48px}
.ni-footer__inner{max-width:1200px;margin:0 auto}
@media(max-width:768px){
  .ni-hero{grid-template-columns:1fr;grid-template-rows:220px auto auto;padding:0 12px;margin-top:16px;margin-bottom:16px;gap:0}
  .ni-hero__track{grid-column:1;grid-row:1;border-radius:12px 12px 0 0;min-height:auto}
  .ni-hero__info{grid-column:1;grid-row:2;border-radius:0;padding:20px 16px}
  .ni-hero__title{font-size:1.3rem}
  .ni-hero__lead{font-size:0.82rem;-webkit-line-clamp:2}
  .ni-hero__indicators{grid-column:1;grid-row:3;border-radius:0 0 12px 12px}
  .ni-content{grid-template-columns:1fr;padding:0 12px;gap:16px}
  .ni-grid{grid-template-columns:1fr}
}
@media(max-width:1024px){
  .ni-content{grid-template-columns:1fr}
  .ni-sidebar{display:none}
}
`;
