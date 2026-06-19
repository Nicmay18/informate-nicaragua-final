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
.ni-main{max-width:1200px;margin:0 auto;padding:24px 20px 60px;display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:40px;overflow:hidden}
.ni-content,.ni-sidebar{min-width:0}
.ni-section{margin-bottom:48px}
.ni-section__header{display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:24px;border-bottom:2px solid #0f172a;padding-bottom:0}
.ni-section__title{font-size:0.95rem;font-weight:800;text-transform:uppercase;letter-spacing:0.04em;color:#0f172a}
.ni-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:24px;align-items:start}
.ni-card{display:grid;grid-template-columns:220px 1fr;gap:20px;padding:24px 0;border-bottom:1px solid #e2e8f0}
.ni-card:first-child{padding-top:0}
.ni-card__thumb{position:relative;width:220px;height:150px;border-radius:10px;overflow:hidden;background:#e2e8f0;flex-shrink:0}
.ni-card__thumb img{width:100%;height:100%;object-fit:cover;object-position:center 20%}
.ni-card__content{display:flex;flex-direction:column;justify-content:center;overflow:hidden;min-width:0}
.ni-card__pill{font-size:0.68rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#0f172a;margin-bottom:6px;width:fit-content}
.ni-card__title{font-family:'Merriweather',serif;font-size:1.18rem;font-weight:700;line-height:1.28;color:#0f172a;margin-bottom:8px;display:-webkit-box;-webkit-line-clamp:2;line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;word-break:break-word}
.ni-card__title a{color:inherit;text-decoration:none}
.ni-card__excerpt{font-size:0.9rem;font-weight:700;line-height:1.55;color:#64748b;margin-bottom:10px;display:-webkit-box;-webkit-line-clamp:2;line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.ni-card__meta{font-size:0.72rem;color:#64748b;display:flex;flex-wrap:wrap;align-items:center;gap:4px 10px;margin-top:auto}
.ni-card__time{white-space:nowrap}
.ni-card__author{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
.ni-grid-2 .ni-card{grid-template-columns:1fr;gap:12px;padding:0 0 16px 0;border-bottom:1px solid #e2e8f0}
.ni-grid-2 .ni-card__thumb{width:100%;height:180px}
.ni-grid-2 .ni-card__title{font-size:1rem}
.ni-sidebar__widget{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:24px;margin-bottom:24px;min-width:0;overflow:hidden}
.ni-footer{background:#0f172a;color:#cbd5e1;padding:40px 20px;margin-top:48px}
.ni-footer__inner{max-width:1200px;margin:0 auto}
@media(max-width:768px){
  .ni-hero{grid-template-columns:1fr;grid-template-rows:220px auto auto;padding:0 12px;margin-top:16px;margin-bottom:16px;gap:0}
  .ni-hero__track{grid-column:1;grid-row:1;border-radius:12px 12px 0 0;min-height:auto}
  .ni-hero__info{grid-column:1;grid-row:2;border-radius:0;padding:20px 16px}
  .ni-hero__title{font-size:1.3rem}
  .ni-hero__lead{font-size:0.82rem;-webkit-line-clamp:2}
  .ni-hero__indicators{grid-column:1;grid-row:3;border-radius:0 0 12px 12px}
  .ni-main{grid-template-columns:1fr;padding:12px 12px 32px;gap:20px}
  .ni-section{margin-bottom:34px}
  .ni-section__header{margin-bottom:12px;padding-bottom:8px}
  .ni-card,.ni-grid-2 .ni-card{grid-template-columns:100px 1fr;gap:12px;padding:12px 0;border-bottom:1px solid #e2e8f0;align-items:start;overflow:hidden}
  .ni-card:first-child{padding-top:0}
  .ni-card:last-child{border-bottom:none}
  .ni-card__thumb,.ni-grid-2 .ni-card__thumb{width:120px;height:90px;border-radius:8px;margin-bottom:0}
  .ni-card__content{width:100%;padding:0;min-width:0}
  .ni-card__pill{font-size:0.6rem;margin-bottom:2px}
  .ni-card__title{font-size:0.95rem;line-height:1.25;margin-bottom:3px}
  .ni-card__excerpt{font-size:0.8rem;line-height:1.4;margin-bottom:4px}
  .ni-card__meta{font-size:0.68rem;gap:4px 8px;margin-top:0}
  .ni-grid-2{grid-template-columns:1fr;gap:0}
}
@media(max-width:1024px){
  .ni-main{grid-template-columns:minmax(0,1fr);padding:20px 16px 48px;gap:28px}
  .ni-grid-2{grid-template-columns:minmax(0,1fr);gap:0}
  .ni-grid-2 .ni-card{grid-template-columns:220px minmax(0,1fr);gap:18px}
  .ni-grid-2 .ni-card__thumb{width:220px;height:150px}
  .ni-sidebar{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}
  .ni-sidebar__widget{margin-bottom:0}
}
@media(max-width:900px){
  .ni-main{padding:18px 14px 44px}
  .ni-sidebar{grid-template-columns:minmax(0,1fr)}
  .ni-section{margin-bottom:34px}
  .ni-card,.ni-grid-2 .ni-card{grid-template-columns:100px 1fr;gap:12px;padding:12px 0;border-bottom:1px solid #e2e8f0;align-items:start;overflow:hidden}
  .ni-card:first-child{padding-top:0}
  .ni-card:last-child{border-bottom:none}
  .ni-card__thumb,.ni-grid-2 .ni-card__thumb{width:120px;height:90px;border-radius:8px;margin-bottom:0}
  .ni-card__content{width:100%;padding:0;min-width:0}
  .ni-card__pill{font-size:0.6rem;margin-bottom:2px}
  .ni-card__title{font-size:0.95rem;line-height:1.25;margin-bottom:3px}
  .ni-card__excerpt{font-size:0.8rem;line-height:1.4;margin-bottom:4px}
  .ni-card__meta{font-size:0.68rem;gap:4px 8px;margin-top:0}
  .ni-grid-2{grid-template-columns:1fr;gap:0}
}
`;
