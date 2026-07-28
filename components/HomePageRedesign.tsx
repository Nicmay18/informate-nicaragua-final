'use client';

export default function HomePageRedesign() {
  const preventSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };

  return (
    <div className="home-redesign">
      <div className="utility">
        <div className="wrap">
          <div className="utility-left">
            <span>Lunes 27 de julio de 2026</span>
            <a href="#">Sobre nosotros</a>
            <a href="#">Contacto</a>
          </div>
          <div className="utility-right">
            <a href="#" className="live-pill"><span className="live-dot"></span> EN VIVO · RADIO</a>
          </div>
        </div>
      </div>

      <header className="masthead">
        <div className="wrap">
          <div className="brand">
            <div className="brand-mark">NI</div>
            <div className="brand-text">
              <div className="name">Nicaragua Infórmate</div>
              <div className="tag">Managua, Nicaragua</div>
            </div>
            <div className="seal-wrap">
              <svg viewBox="0 0 200 200" width="58" height="58">
                <path id="ringPathMain" d="M100,100 m-82,0 a82,82 0 1,1 164,0 a82,82 0 1,1 -164,0" fill="none"/>
                <circle cx="100" cy="100" r="94" fill="none" stroke="#0E6E6A" strokeWidth="2.5"/>
                <circle cx="100" cy="100" r="68" fill="none" stroke="#0E6E6A" strokeWidth="1.5"/>
                <text fontFamily="'IBM Plex Mono',monospace" fontSize="10.5" letterSpacing="2.6" fill="#0E6E6A">
                  <textPath xlinkHref="#ringPathMain" startOffset="0%">PERIODISMO VERIFICADO • FUENTES IDENTIFICABLES • </textPath>
                </text>
                <g transform="translate(100,100)">
                  <circle r="44" fill="#0B1C2C"/>
                  <path d="M-17,0 L-6,12 L19,-14" fill="none" stroke="#E3F0EE" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
                </g>
              </svg>
            </div>
          </div>
          <div className="masthead-tools">
            <span className="dateline">Managua, 27°C</span>
            <button aria-label="Buscar">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
            </button>
          </div>
        </div>
        <nav className="primary">
          <div className="wrap">
            <a href="#" className="is-active">Inicio</a>
            <a href="#">Sucesos</a>
            <a href="#">Nacionales</a>
            <a href="#">Espectáculos</a>
            <a href="#">Deportes</a>
            <a href="#">Tecnología</a>
            <a href="#">Internacionales</a>
          </div>
        </nav>
      </header>

      <div className="horizon" aria-hidden="true">
        <svg viewBox="0 0 1180 22" preserveAspectRatio="none">
          <polyline points="0,22 90,22 150,4 190,17 260,22 340,22 400,9 445,22 540,22 610,2 655,20 720,22 810,22 865,7 905,22 980,22 1040,11 1080,22 1180,22"
            fill="none" stroke="#0E6E6A" strokeWidth="1.4" strokeLinejoin="round"/>
          <circle cx="150" cy="4" r="1.6" fill="#0E6E6A"/>
          <circle cx="610" cy="2" r="1.6" fill="#0E6E6A"/>
          <circle cx="865" cy="7" r="1.6" fill="#0E6E6A"/>
        </svg>
      </div>

      <div className="breaking">
        <div className="wrap">
          <span className="breaking-tag"><span className="dot"></span>Última hora</span>
          <div className="breaking-list">
            <a href="#">Baile de los Chinegros mantiene vivo un ritual de 400 años</a>
            <a href="#">Nicaragua reporta menos casos de dengue, malaria e influenza</a>
            <a href="#">Café nicaragüense alcanza récord mundial y abre nuevos retos</a>
          </div>
        </div>
      </div>

      <div className="home-main">
        <div className="wrap">

          <section className="hero">
            <article className="lead">
              <span className="eyebrow">Nacionales</span>
              <div className="lead-photo">
                <svg viewBox="0 0 400 140" preserveAspectRatio="none"><path d="M0,140 L60,60 L95,95 L150,20 L210,90 L250,55 L400,140 Z" fill="rgba(255,255,255,.055)"/></svg>
                <span className="photo-credit">Foto: Alcaldía de Managua</span>
              </div>
              <h1><a href="#">Volcán Telica expulsa ceniza y mantiene vigilancia activa</a></h1>
              <p className="dek">El volcán Telica registró expulsión de gases y cenizas de baja intensidad. Autoridades mantienen vigilancia mientras no se reportan afectaciones.</p>
              <div className="byline"><span>Maycol Josué</span><span className="sep"></span><time>Hace 3 días</time><span className="sep"></span><span>1 min de lectura</span></div>
            </article>

            <aside className="en-portada">
              <div className="rail-title">En portada</div>
              <div className="portada-item">
                <span className="eyebrow is-deportes">Deportes</span>
                <h3><a href="#">Multiestadio Stanley Cayasso: así avanzan sus bases en Managua</a></h3>
                <time>Hace 1 día</time>
              </div>
              <div className="portada-item">
                <span className="eyebrow">Nacionales</span>
                <h3><a href="#">Café nicaragüense alcanza récord mundial y abre nuevos retos</a></h3>
                <time>Hace 3 días</time>
              </div>
              <div className="portada-item">
                <span className="eyebrow">Nacionales</span>
                <h3><a href="#">Nicaragua reporta menos casos de dengue, malaria e influenza</a></h3>
                <time>Hace 3 días</time>
              </div>
              <div className="portada-item">
                <span className="eyebrow">Espectáculos</span>
                <h3><a href="#">Baile de los Chinegros mantiene vivo un ritual de 400 años</a></h3>
                <time>Hace 3 días</time>
              </div>
            </aside>
          </section>

          <div className="content-grid">
            <div className="main-col">

              <section className="section">
                <div className="section-head"><h2>Nacionales</h2><a href="#">Ver más →</a></div>
                <div className="story-grid">
                  <article className="story-primary">
                    <div className="photo"><svg viewBox="0 0 300 160" preserveAspectRatio="none"><path d="M0,160 L50,80 L90,120 L140,40 L190,110 L230,70 L300,160 Z" fill="rgba(255,255,255,.05)"/></svg></div>
                    <h3><a href="#">Puerto Corinto lidera llegada de 11 buques a Nicaragua</a></h3>
                    <p>Nicaragua atendió 11 buques internacionales del 13 al 19 de julio. Puerto Corinto recibió ocho embarcaciones para fortalecer el comercio exterior.</p>
                    <div className="byline"><time>Hace 4 días</time></div>
                  </article>
                  <div className="story-secondary">
                    <div className="item">
                      <div className="thumb"></div>
                      <div><h4><a href="#">Managua inicia sus fiestas 2026 con programa y asuetos</a></h4><time>Hace 5 días</time></div>
                    </div>
                    <div className="item">
                      <div className="thumb"></div>
                      <div><h4><a href="#">Más allá del cráter: los senderos del Volcán Masaya</a></h4><time>Hace 6 días</time></div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="section">
                <div className="section-head"><h2>Sucesos</h2><a href="#">Ver más →</a></div>
                <div className="story-grid is-reverse">
                  <div className="story-secondary">
                    <div className="item">
                      <div className="thumb"></div>
                      <div><h4><a href="#">Muere trabajador tras ataque de un perro en Managua</a></h4><time>Hace 4 h</time></div>
                    </div>
                    <div className="item">
                      <div className="thumb"></div>
                      <div><h4><a href="#">Accidentes en Nicaragua dejan un fallecido y varios heridos</a></h4><time>Hace 3 días</time></div>
                    </div>
                  </div>
                  <article className="story-primary">
                    <div className="photo"><svg viewBox="0 0 300 160" preserveAspectRatio="none"><path d="M0,160 L40,100 L100,130 L150,50 L200,120 L260,80 L300,160 Z" fill="rgba(255,255,255,.05)"/></svg></div>
                    <span className="eyebrow is-sucesos">Sucesos</span>
                    <h3><a href="#">El caso que estremeció Tipitapa entra a una nueva etapa judicial</a></h3>
                    <div className="byline"><time>Hace 3 días</time></div>
                  </article>
                </div>
              </section>

              <section className="section">
                <div className="section-head"><h2>Deportes</h2><a href="#">Ver más →</a></div>
                <div className="story-grid">
                  <article className="story-primary">
                    <div className="photo"><svg viewBox="0 0 300 160" preserveAspectRatio="none"><path d="M0,160 L60,90 L110,125 L160,55 L210,115 L250,85 L300,160 Z" fill="rgba(255,255,255,.05)"/></svg></div>
                    <span className="eyebrow is-deportes">Deportes</span>
                    <h3><a href="#">Multiestadio Stanley Cayasso: así avanzan sus bases en Managua</a></h3>
                    <p>La Alcaldía de Managua avanza en la construcción del Multiestadio Stanley Cayasso: costos, contratista, historia del predio y fecha estimada de entrega.</p>
                    <div className="byline"><time>Hace 1 día</time></div>
                  </article>
                  <div className="story-secondary">
                    <div className="item">
                      <div className="thumb"></div>
                      <div><h4><a href="#">Mineros avanza de ronda y deja en disputa el último boleto</a></h4><time>Hace 4 días</time></div>
                    </div>
                    <div className="item">
                      <div className="thumb"></div>
                      <div><h4><a href="#">Con 204 representantes, Nicaragua va por nuevas medallas</a></h4><time>Hace 6 días</time></div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="section">
                <div className="section-head"><h2>Internacionales</h2><a href="#">Ver más →</a></div>
                <div className="story-grid">
                  <article className="story-primary">
                    <div className="photo"><svg viewBox="0 0 300 160" preserveAspectRatio="none"><path d="M0,160 L45,95 L95,130 L145,45 L195,115 L245,75 L300,160 Z" fill="rgba(255,255,255,.05)"/></svg></div>
                    <h3><a href="#">Después de años prófugo, captura de El Diablo abre interrogante</a></h3>
                    <p>Alejandro Arias Monge fue capturado en Sarapiquí tras años de búsqueda. El operativo inicia una nueva etapa judicial para uno de los casos más relevantes.</p>
                    <div className="byline"><time>Hace 3 días</time></div>
                  </article>
                  <div className="story-secondary">
                    <div className="item">
                      <div className="thumb"></div>
                      <div><h4><a href="#">Dos nicaragüenses fallecen en el extranjero en casos distintos</a></h4><time>Hace 4 días</time></div>
                    </div>
                    <div className="item">
                      <div className="thumb"></div>
                      <div><h4><a href="#">Colapso en construcción cobra vida de nicaragüense en EE. UU.</a></h4><time>Hace 5 días</time></div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="section" style={{ marginBottom: 0 }}>
                <div className="section-head"><h2>Tecnología</h2><a href="#">Ver más →</a></div>
                <div className="story-grid">
                  <article className="story-primary">
                    <div className="photo"><svg viewBox="0 0 300 160" preserveAspectRatio="none"><path d="M0,160 L55,85 L105,120 L155,50 L205,110 L255,90 L300,160 Z" fill="rgba(255,255,255,.05)"/></svg></div>
                    <h3><a href="#">Kimi AI acelera la carrera mundial por la inteligencia artificial</a></h3>
                    <p>Kimi AI, desarrollado por Moonshot AI en China, apuesta por programación, documentos extensos y código abierto para competir en inteligencia artificial.</p>
                    <div className="byline"><time>Hace 4 días</time></div>
                  </article>
                  <div className="story-secondary">
                    <div className="item">
                      <div className="thumb"></div>
                      <div><h4><a href="#">Prueba de IA obliga a OpenAI a reforzar su seguridad digital</a></h4><time>Hace 5 días</time></div>
                    </div>
                    <div className="item">
                      <div className="thumb"></div>
                      <div><h4><a href="#">NASA cuestiona límite de tormentas solares con estudio en Nature</a></h4><time>Hace 7 días</time></div>
                    </div>
                  </div>
                </div>
              </section>

            </div>

            <aside className="rail">

              <div className="service">
                <div className="panel-head">Indicadores · hoy 6:00 a.m.</div>
                <div className="service-row"><span className="label">Dólar oficial</span><span className="value">C$ 37.12<span className="delta">+0.01</span></span></div>
                <div className="service-row"><span className="label">Córdoba / USD</span><span className="value">1 : 37.12</span></div>
                <div className="service-row"><span className="label">Clima Managua</span><span className="value">31°C, soleado</span></div>
                <p className="service-note">Cifras ilustrativas para esta maqueta de diseño.</p>
              </div>

              <div className="panel">
                <div className="radio-bar">
                  <button className="play-btn" aria-label="Reproducir radio">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4l15 8-15 8V4z"/></svg>
                  </button>
                  <div className="radio-info">
                    <div className="st">Radio en vivo</div>
                    <div className="sub">Las emisoras más escuchadas del país</div>
                  </div>
                </div>
              </div>

              <div className="panel">
                <div className="panel-head">Más leídas</div>
                <ol className="most-read">
                  <li><span className="n">01</span><h4><a href="#">Guía de señalización vial en Nicaragua: líneas y multas Ley 431</a></h4></li>
                  <li><span className="n">02</span><h4><a href="#">Multiestadio Stanley Cayasso: así avanzan sus bases en Managua</a></h4></li>
                  <li><span className="n">03</span><h4><a href="#">Dólar a córdoba hoy: tipo de cambio 2026</a></h4></li>
                  <li><span className="n">04</span><h4><a href="#">Volcán Telica expulsa ceniza y mantiene vigilancia activa</a></h4></li>
                  <li><span className="n">05</span><h4><a href="#">Salario mínimo en Nicaragua 2026</a></h4></li>
                </ol>
              </div>

              <div className="panel">
                <div className="panel-head">Guías útiles</div>
                <nav className="guides">
                  <a href="#">Trámites migratorios <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6l6 6-6 6"/></svg></a>
                  <a href="#">Apostillar documentos <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6l6 6-6 6"/></svg></a>
                  <a href="#">Salario mínimo 2026 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6l6 6-6 6"/></svg></a>
                  <a href="#">Costo de vida <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6l6 6-6 6"/></svg></a>
                  <a href="#">Dólar a córdoba <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6l6 6-6 6"/></svg></a>
                </nav>
              </div>

              <div className="newsletter">
                <h3>Boletín matutino</h3>
                <p>Recibe las noticias más importantes de Nicaragua cada mañana, directo a tu correo.</p>
                <form onSubmit={preventSubmit}>
                  <input type="email" placeholder="nombre@correo.com" aria-label="Correo electrónico" />
                  <button type="submit">Suscribirme</button>
                </form>
              </div>

              <div className="social-row">
                <a href="#" aria-label="Facebook"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 21v-7.5H16l.4-3H13.5V8.4c0-.87.24-1.46 1.5-1.46H16.5V4.35C16.24 4.32 15.36 4.25 14.33 4.25c-2.15 0-3.62 1.31-3.62 3.72v2.53H8.25v3H10.71V21h2.79z"/></svg></a>
                <a href="#" aria-label="WhatsApp"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3a9 9 0 00-7.75 13.6L3 21l4.55-1.2A9 9 0 1012 3zm0 16.3a7.3 7.3 0 01-3.72-1.02l-.27-.16-2.7.71.72-2.63-.18-.27A7.3 7.3 0 1112 19.3zm4-5.47c-.22-.11-1.3-.64-1.5-.72s-.35-.11-.5.11-.57.72-.7.87-.26.17-.48.06a6 6 0 01-1.76-1.08 6.6 6.6 0 01-1.22-1.52c-.13-.22 0-.34.1-.45.1-.1.22-.26.33-.39.11-.13.15-.22.22-.37.07-.15.04-.28-.02-.39s-.5-1.2-.68-1.65c-.18-.43-.36-.37-.5-.38h-.43a.83.83 0 00-.6.28 2.53 2.53 0 00-.78 1.87c0 1.1.8 2.17.91 2.32.11.15 1.57 2.4 3.8 3.36.53.23.95.37 1.27.47.53.17 1.02.14 1.4.09.43-.06 1.3-.53 1.48-1.04.18-.51.18-.95.13-1.04-.05-.09-.2-.15-.42-.26z"/></svg></a>
                <a href="#" aria-label="Telegram"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.5 4.5L3.6 11.4c-1.1.44-1.1 1.06-.2 1.33l4.6 1.44 1.77 5.4c.22.6.4.83.8.83.35 0 .5-.16.7-.35l1.9-1.85 4 2.94c.7.4 1.22.2 1.4-.65l2.5-11.9c.28-1.1-.4-1.6-1.17-1.15z"/></svg></a>
              </div>

            </aside>
          </div>

        </div>
      </div>

      <footer>
        <div className="wrap">
          <div className="foot-grid">
            <div className="foot-brand">
              <div className="name">Nicaragua Infórmate</div>
              <p>Medio digital nicaragüense de noticias verificadas. Periodismo independiente con cobertura nacional e internacional desde Managua. Fundado en 2024 y editado por periodistas locales.</p>
              <div className="social-row">
                <a href="#" aria-label="Facebook"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 21v-7.5H16l.4-3H13.5V8.4c0-.87.24-1.46 1.5-1.46H16.5V4.35C16.24 4.32 15.36 4.25 14.33 4.25c-2.15 0-3.62 1.31-3.62 3.72v2.53H8.25v3H10.71V21h2.79z"/></svg></a>
                <a href="#" aria-label="WhatsApp"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3a9 9 0 00-7.75 13.6L3 21l4.55-1.2A9 9 0 1012 3z"/></svg></a>
                <a href="#" aria-label="Telegram"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.5 4.5L3.6 11.4c-1.1.44-1.1 1.06-.2 1.33l4.6 1.44 1.77 5.4c.22.6.4.83.8.83.35 0 .5-.16.7-.35l1.9-1.85 4 2.94c.7.4 1.22.2 1.4-.65l2.5-11.9c.28-1.1-.4-1.6-1.17-1.15z"/></svg></a>
              </div>
            </div>
            <div>
              <h5>Secciones</h5>
              <ul>
                <li><a href="#">Sucesos</a></li>
                <li><a href="#">Nacionales</a></li>
                <li><a href="#">Espectáculos</a></li>
                <li><a href="#">Deportes</a></li>
                <li><a href="#">Tecnología</a></li>
                <li><a href="#">Internacionales</a></li>
              </ul>
            </div>
            <div>
              <h5>Nosotros</h5>
              <ul>
                <li><a href="#">Quiénes somos</a></li>
                <li><a href="#">Contacto</a></li>
                <li><a href="#">Política editorial</a></li>
                <li><a href="#">Publicidad</a></li>
              </ul>
            </div>
            <div>
              <h5>Radio Nicaragua</h5>
              <div className="radio-cta">
                <p>Escucha las radios más populares del país, en vivo y sin cortes.</p>
                <a href="#" className="btn">Ir a radio en vivo →</a>
              </div>
            </div>
          </div>
          <div className="legal-row">
            <div className="legal-links">
              <a href="#">Política editorial</a>
              <a href="#">Correcciones</a>
              <a href="#">Privacidad</a>
              <a href="#">Términos</a>
              <a href="#">Cookies</a>
              <a href="#">Publicidad</a>
            </div>
            <div className="copyright">© 2026 Nicaragua Infórmate. Managua, Nicaragua · Periodismo verificado.</div>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        :root{
          --ink:#0B1C2C;
          --ink-2:#14293D;
          --paper:#F6F4EE;
          --card:#FFFFFF;
          --text:#181D24;
          --muted:#5B6472;
          --line:#E2DED2;
          --red:#B3261E;
          --red-soft:#F6E7E5;
          --accent:#0E6E6A;
          --accent-soft:#E3F0EE;
          --radius:4px;
          --serif:'Spectral',Georgia,serif;
          --sans:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;
          --mono:'IBM Plex Mono',ui-monospace,monospace;
        }
        *{box-sizing:border-box;}
        html{scroll-behavior:smooth;}
        body{
          margin:0;
          padding-bottom:0;
          background:var(--paper);
          color:var(--text);
          font-family:var(--sans);
          -webkit-font-smoothing:antialiased;
        }
        a{color:inherit;text-decoration:none;}
        img,svg{display:block;}
        .wrap{max-width:1180px;margin:0 auto;padding:0 24px;}
        :focus-visible{outline:2px solid var(--accent);outline-offset:2px;}

        /* ---------- Utility bar ---------- */
        .utility{background:var(--ink);color:#CBD4DD;font-family:var(--mono);font-size:12px;}
        .utility .wrap{display:flex;align-items:center;justify-content:space-between;height:36px;}
        .utility-left{display:flex;gap:18px;align-items:center;}
        .utility-right{display:flex;gap:18px;align-items:center;}
        .utility a:hover{color:#fff;}
        .live-pill{display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,.08);padding:4px 10px;border-radius:999px;}
        .live-dot{width:6px;height:6px;border-radius:50%;background:var(--red);animation:pulse 2s infinite;}
        @media (prefers-reduced-motion: reduce){.live-dot{animation:none;}}
        @keyframes pulse{0%,100%{opacity:1;}50%{opacity:.35;}}

        /* ---------- Masthead ---------- */
        .masthead{background:var(--paper);border-bottom:1px solid var(--line);}
        .masthead .wrap{padding:22px 24px 16px;display:flex;align-items:center;justify-content:space-between;gap:24px;}
        .brand{display:flex;align-items:center;gap:16px;}
        .brand-mark{width:44px;height:44px;flex:none;border:1.5px solid var(--ink);border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:var(--serif);font-weight:700;font-size:18px;color:var(--ink);}
        .brand-text .name{font-family:var(--serif);font-weight:700;font-size:27px;letter-spacing:.3px;line-height:1;}
        .brand-text .tag{margin-top:5px;font-family:var(--mono);font-size:11px;letter-spacing:.04em;color:var(--muted);text-transform:uppercase;}
        .seal-wrap{flex:none;width:58px;height:58px;margin-left:4px;}
        .masthead-tools{display:flex;align-items:center;gap:18px;color:var(--muted);}
        .masthead-tools button{background:none;border:none;color:inherit;cursor:pointer;display:flex;padding:6px;}
        .dateline{font-family:var(--mono);font-size:12px;color:var(--muted);white-space:nowrap;}

        nav.primary{border-top:1px solid var(--line);background:var(--paper);}
        nav.primary .wrap{display:flex;align-items:center;gap:2px;overflow-x:auto;}
        nav.primary a{font-family:var(--mono);font-size:12.5px;letter-spacing:.05em;text-transform:uppercase;padding:14px 16px;color:var(--text);white-space:nowrap;border-bottom:2px solid transparent;}
        nav.primary a:hover{color:var(--accent);}
        nav.primary a.is-active{border-bottom-color:var(--accent);color:var(--accent);}

        /* ---------- Signature: volcanic horizon divider ---------- */
        .horizon{background:var(--paper);line-height:0;}
        .horizon svg{width:100%;height:22px;display:block;}

        /* ---------- Breaking bar ---------- */
        .breaking{background:var(--ink);color:#fff;}
        .breaking .wrap{display:flex;align-items:center;gap:16px;height:44px;}
        .breaking-tag{flex:none;display:flex;align-items:center;gap:6px;font-family:var(--mono);font-size:11.5px;letter-spacing:.06em;color:#F3D9D6;text-transform:uppercase;}
        .breaking-tag .dot{width:6px;height:6px;border-radius:50%;background:var(--red);}
        .breaking-list{display:flex;gap:34px;overflow:hidden;white-space:nowrap;font-size:13.5px;}
        .breaking-list a{opacity:.92;}
        .breaking-list a:hover{opacity:1;text-decoration:underline;text-underline-offset:3px;}

        /* ---------- Layout ---------- */
        .home-main .wrap{padding-top:34px;padding-bottom:56px;}
        .eyebrow{font-family:var(--mono);font-size:11.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);}
        .eyebrow.is-sucesos{color:var(--red);}
        .eyebrow.is-deportes{color:var(--accent);}

        /* ---------- Hero ---------- */
        .hero{display:grid;grid-template-columns:1.65fr 1fr;gap:40px;padding-bottom:44px;border-bottom:1px solid var(--line);}
        .lead-photo{aspect-ratio:16/9;border-radius:var(--radius);overflow:hidden;position:relative;background:
            linear-gradient(160deg,#13314A 0%,#0B1C2C 62%),
            repeating-linear-gradient(115deg, rgba(255,255,255,.05) 0 2px, transparent 2px 26px);
        }
        .lead-photo svg{position:absolute;bottom:-6%;left:0;width:100%;height:62%;}
        .photo-credit{position:absolute;right:10px;bottom:8px;font-family:var(--mono);font-size:10.5px;color:rgba(255,255,255,.75);}
        .lead h1{font-family:var(--serif);font-weight:700;font-size:38px;line-height:1.12;margin:16px 0 12px;letter-spacing:-.2px;}
        .lead h1 a:hover{text-decoration:underline;text-decoration-color:var(--accent);text-underline-offset:5px;}
        .dek{font-family:var(--serif);font-size:17px;line-height:1.5;color:#3A414B;margin:0 0 14px;}
        .byline{font-family:var(--mono);font-size:12px;color:var(--muted);display:flex;gap:10px;align-items:center;}
        .byline .sep{width:3px;height:3px;border-radius:50%;background:var(--muted);}

        .en-portada{display:flex;flex-direction:column;}
        .en-portada .rail-title{font-family:var(--mono);font-size:11.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--ink);padding-bottom:10px;margin-bottom:14px;border-bottom:1.5px solid var(--ink);}
        .portada-item{padding:14px 0;border-bottom:1px solid var(--line);}
        .portada-item:last-child{border-bottom:none;}
        .portada-item h3{font-family:var(--serif);font-size:16.5px;line-height:1.35;font-weight:600;margin:6px 0 6px;}
        .portada-item h3 a:hover{color:var(--accent);}
        .portada-item time{font-family:var(--mono);font-size:11px;color:var(--muted);}

        /* ---------- Section grid (main col + sidebar) ---------- */
        .content-grid{display:grid;grid-template-columns:1fr 320px;gap:48px;margin-top:40px;align-items:start;}

        .section{margin-bottom:46px;}
        .section-head{display:flex;align-items:baseline;justify-content:space-between;border-bottom:2px solid var(--ink);padding-bottom:9px;margin-bottom:22px;}
        .section-head h2{font-family:var(--serif);font-size:22px;font-weight:600;margin:0;letter-spacing:.2px;}
        .section-head a{font-family:var(--mono);font-size:11.5px;letter-spacing:.04em;color:var(--muted);}
        .section-head a:hover{color:var(--accent);}

        .story-grid{display:grid;grid-template-columns:1.3fr 1fr;gap:30px;}
        .story-grid.is-reverse{grid-template-columns:1fr 1.3fr;}
        .story-grid.is-reverse .story-primary{order:2;}
        .story-primary .photo{aspect-ratio:4/3;border-radius:var(--radius);overflow:hidden;position:relative;margin-bottom:14px;background:
            linear-gradient(155deg,#12293E 0%,#0B1C2C 65%),
            repeating-linear-gradient(70deg, rgba(255,255,255,.045) 0 2px, transparent 2px 22px);
        }
        .story-primary .photo svg{position:absolute;bottom:-8%;left:0;width:100%;height:58%;opacity:.9;}
        .story-primary h3{font-family:var(--serif);font-size:23px;line-height:1.25;font-weight:600;margin:10px 0 8px;}
        .story-primary h3 a:hover{color:var(--accent);}
        .story-primary p{font-family:var(--serif);font-size:15px;color:#454C55;line-height:1.5;margin:0 0 8px;}

        .story-secondary{display:flex;flex-direction:column;gap:20px;}
        .story-secondary .item{display:flex;gap:14px;padding-bottom:20px;border-bottom:1px solid var(--line);}
        .story-secondary .item:last-child{border:none;padding-bottom:0;}
        .story-secondary .thumb{flex:none;width:84px;height:84px;border-radius:var(--radius);background:
            linear-gradient(160deg,#16324A 0%,#0B1C2C 70%);}
        .story-secondary h4{font-family:var(--serif);font-size:15.5px;line-height:1.3;font-weight:600;margin:2px 0 8px;}
        .story-secondary h4 a:hover{color:var(--accent);}

        /* ---------- Sidebar ---------- */
        aside.rail{position:sticky;top:24px;display:flex;flex-direction:column;gap:28px;}
        .panel{background:var(--card);border:1px solid var(--line);border-radius:var(--radius);}
        .panel-head{font-family:var(--mono);font-size:11.5px;letter-spacing:.08em;text-transform:uppercase;padding:13px 16px;border-bottom:1px solid var(--line);color:var(--ink);}

        .service{background:var(--ink);color:#fff;border-radius:var(--radius);padding:18px 18px 6px;}
        .service .panel-head{border-color:rgba(255,255,255,.15);color:#DCE3E9;padding:0 0 12px;margin-bottom:14px;}
        .service-row{display:flex;justify-content:space-between;align-items:baseline;padding:9px 0;border-bottom:1px solid rgba(255,255,255,.1);}
        .service-row:last-of-type{border-bottom:none;}
        .service-row .label{font-size:13px;color:#B8C2CC;}
        .service-row .value{font-family:var(--mono);font-size:14.5px;color:#fff;}
        .service-row .delta{font-family:var(--mono);font-size:11px;color:#9FD6B4;margin-left:6px;}
        .service-note{font-family:var(--mono);font-size:10.5px;color:#8493A0;padding:10px 0 16px;}

        .radio-bar{display:flex;align-items:center;gap:12px;padding:14px 16px;}
        .play-btn{flex:none;width:36px;height:36px;border-radius:50%;border:1.5px solid var(--ink);display:flex;align-items:center;justify-content:center;background:none;cursor:pointer;}
        .radio-info .st{font-family:var(--serif);font-weight:600;font-size:14.5px;}
        .radio-info .sub{font-family:var(--mono);font-size:11px;color:var(--muted);}

        .most-read{padding:6px 16px 10px;}
        .most-read li{list-style:none;display:flex;gap:12px;padding:12px 0;border-bottom:1px solid var(--line);align-items:baseline;}
        .most-read li:last-child{border:none;}
        .most-read .n{font-family:var(--serif);font-weight:700;font-size:19px;color:var(--accent);flex:none;width:20px;}
        .most-read h4{font-family:var(--serif);font-size:14.5px;line-height:1.35;font-weight:600;margin:0;}
        .most-read h4 a:hover{color:var(--accent);}

        .guides{padding:4px 4px 10px;}
        .guides a{display:flex;align-items:center;justify-content:space-between;padding:11px 14px;font-size:13.5px;border-bottom:1px solid var(--line);}
        .guides a:last-child{border:none;}
        .guides a:hover{background:var(--accent-soft);}
        .guides svg{width:13px;height:13px;color:var(--muted);flex:none;}

        .newsletter{background:var(--accent-soft);border:1px solid #B9DAD6;border-radius:var(--radius);padding:20px;}
        .newsletter h3{font-family:var(--serif);font-size:17px;margin:0 0 6px;}
        .newsletter p{font-size:13px;color:#0B3D3A;margin:0 0 14px;line-height:1.45;}
        .newsletter form{display:flex;gap:8px;}
        .newsletter input{flex:1;min-width:0;border:1px solid #A9CFCB;border-radius:var(--radius);padding:9px 10px;font-family:var(--sans);font-size:13px;background:#fff;}
        .newsletter button{background:var(--ink);color:#fff;border:none;border-radius:var(--radius);padding:9px 14px;font-size:13px;font-weight:500;cursor:pointer;white-space:nowrap;}
        .newsletter button:hover{background:var(--ink-2);}

        .social-row{display:flex;gap:10px;}
        .social-row a{width:36px;height:36px;border:1px solid var(--line);border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--ink);}
        .social-row a:hover{border-color:var(--ink);}
        .social-row svg{width:16px;height:16px;}

        /* ---------- Footer ---------- */
        footer{background:var(--ink);color:#B8C2CC;margin-top:20px;}
        footer .wrap{padding:52px 24px 26px;}
        .foot-grid{display:grid;grid-template-columns:1.4fr 1fr 1fr 1fr;gap:40px;padding-bottom:36px;border-bottom:1px solid rgba(255,255,255,.12);}
        .foot-brand .name{font-family:var(--serif);font-weight:700;font-size:20px;color:#fff;}
        .foot-brand p{font-size:13.5px;line-height:1.6;margin:14px 0 18px;color:#9FABB8;}
        footer h5{font-family:var(--mono);font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#8493A0;margin:0 0 16px;}
        footer ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:11px;}
        footer ul a{font-size:13.5px;}
        footer ul a:hover{color:#fff;}
        .radio-cta{border:1px solid rgba(255,255,255,.18);border-radius:var(--radius);padding:16px;}
        .radio-cta p{font-size:13px;color:#9FABB8;margin:0 0 12px;line-height:1.5;}
        .radio-cta a.btn{display:inline-flex;align-items:center;gap:6px;font-size:12.5px;font-family:var(--mono);color:var(--accent);border:1px solid var(--accent);padding:8px 12px;border-radius:var(--radius);}
        .radio-cta a.btn:hover{background:var(--accent);color:var(--ink);}
        .legal-row{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;padding-top:22px;font-size:12px;}
        .legal-links{display:flex;flex-wrap:wrap;gap:16px;}
        .legal-links a:hover{color:#fff;}
        .copyright{color:#78859299;font-family:var(--mono);}

        @media (max-width: 880px){
          .hero{grid-template-columns:1fr;}
          .content-grid{grid-template-columns:1fr;}
          aside.rail{position:static;}
          .story-grid,.story-grid.is-reverse{grid-template-columns:1fr;}
          .story-grid.is-reverse .story-primary{order:0;}
          .foot-grid{grid-template-columns:1fr 1fr;}
          .utility .wrap{font-size:11px;}
          .lead h1{font-size:29px;}
        }
      `}</style>
    </div>
  );
}
