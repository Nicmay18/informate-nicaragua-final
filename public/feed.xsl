<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes" doctype-system="about:legacy-compat"/>
  <xsl:template match="/">
    <html lang="es">
      <head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title><xsl:value-of select="/rss/channel/title"/> &#8212; Feed RSS</title>
        <link rel="icon" href="/logo.png"/>
        <style>
          *{box-sizing:border-box;margin:0;padding:0}
          body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#fffdf9;color:#18181b;line-height:1.6}
          .wrap{max-width:880px;margin:0 auto;padding:24px 20px 80px}
          .hero{background:linear-gradient(135deg,#8c1d18 0%,#c41e3a 100%);color:#fff;padding:36px 32px;border-radius:16px;margin-bottom:28px;box-shadow:0 8px 24px rgba(140,29,24,0.2)}
          .hero-top{display:flex;align-items:center;gap:14px;margin-bottom:18px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;opacity:0.9}
          .hero-top .dot{width:8px;height:8px;background:#fef3c7;border-radius:50%;box-shadow:0 0 10px #fbbf24}
          .hero h1{font-family:'Crimson Pro',Georgia,serif;font-size:clamp(26px,3.5vw,38px);font-weight:700;letter-spacing:-0.02em;margin-bottom:10px;line-height:1.15}
          .hero p{font-size:15px;opacity:0.92;max-width:560px;line-height:1.55}
          .info-box{background:#f8f6f2;border:1px solid #e5e0d8;border-radius:12px;padding:20px 22px;margin-bottom:28px;display:flex;gap:16px;align-items:flex-start}
          .info-icon{width:40px;height:40px;background:#8c1d18;color:#fff;border-radius:10px;display:grid;place-items:center;font-size:18px;flex-shrink:0}
          .info-box h2{font-size:15px;font-weight:700;margin-bottom:6px;color:#18181b}
          .info-box p{font-size:13.5px;color:#5b5b5f;line-height:1.6}
          .info-box code{background:#fff;border:1px solid #ddd6ce;padding:2px 7px;border-radius:4px;font-size:12.5px;color:#8c1d18;font-family:'SF Mono',Monaco,monospace}
          .readers{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-bottom:32px}
          .reader{background:#fff;border:1px solid #e5e0d8;border-radius:10px;padding:12px 14px;text-decoration:none;color:#18181b;font-size:13px;font-weight:600;display:flex;align-items:center;gap:8px;transition:all 0.2s}
          .reader:hover{border-color:#8c1d18;color:#8c1d18;transform:translateY(-2px);box-shadow:0 4px 12px rgba(140,29,24,0.1)}
          .reader-icon{width:26px;height:26px;background:#f1ece4;border-radius:6px;display:grid;place-items:center;font-size:13px}
          .section-title{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.12em;color:#8c1d18;margin-bottom:14px;display:flex;align-items:center;gap:10px}
          .section-title::after{content:"";flex:1;height:1px;background:#ddd6ce}
          .item{background:#fff;border:1px solid #e5e0d8;border-radius:12px;padding:20px 22px;margin-bottom:14px;transition:all 0.2s}
          .item:hover{border-color:#8c1d18;box-shadow:0 4px 16px rgba(0,0,0,0.06);transform:translateY(-1px)}
          .item-meta{display:flex;align-items:center;gap:10px;margin-bottom:10px;flex-wrap:wrap}
          .item-cat{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;color:#fff;background:#8c1d18;padding:4px 10px;border-radius:4px}
          .item-date{font-size:12px;color:#9f968d;font-weight:500}
          .item h3{font-family:'Crimson Pro',Georgia,serif;font-size:19px;font-weight:700;line-height:1.3;margin-bottom:8px}
          .item h3 a{color:#18181b;text-decoration:none}
          .item h3 a:hover{color:#8c1d18}
          .item-desc{font-size:14px;color:#5b5b5f;line-height:1.6;margin-bottom:10px}
          .item-link{font-size:12px;color:#8c1d18;font-weight:600;text-decoration:none;display:inline-flex;align-items:center;gap:4px}
          .item-link:hover{text-decoration:underline}
          footer{margin-top:40px;padding-top:24px;border-top:1px solid #ddd6ce;text-align:center;font-size:12.5px;color:#9f968d}
          footer a{color:#8c1d18;text-decoration:none;font-weight:600}
          .badge{display:inline-block;background:#fef3c7;color:#92400e;padding:3px 9px;border-radius:999px;font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin-left:8px}
        </style>
      </head>
      <body>
        <div class="wrap">
          <div class="hero">
            <div class="hero-top">
              <span class="dot"></span>
              <span>Feed RSS &#183; Actualizado en tiempo real</span>
            </div>
            <h1><xsl:value-of select="/rss/channel/title"/></h1>
            <p><xsl:value-of select="/rss/channel/description"/></p>
          </div>

          <div class="info-box">
            <div class="info-icon">&#128240;</div>
            <div>
              <h2>Est&#225;s viendo un feed RSS <span class="badge">XML</span></h2>
              <p>
                Esta p&#225;gina es un <strong>feed de noticias</strong> para suscriptores autom&#225;ticos. Copia esta URL en tu lector de RSS favorito (Feedly, Inoreader, Thunderbird, NetNewsWire) para recibir las &#250;ltimas noticias de Nicaragua autom&#225;ticamente:
                <br/><br/>
                <code><xsl:value-of select="/rss/channel/atom:link/@href"/></code>
              </p>
            </div>
          </div>

          <div class="section-title">Suscribirse con un lector</div>
          <div class="readers">
            <a class="reader" target="_blank" rel="noopener">
              <xsl:attribute name="href">https://feedly.com/i/subscription/feed/<xsl:value-of select="/rss/channel/atom:link/@href"/></xsl:attribute>
              <span class="reader-icon">&#128240;</span> Feedly
            </a>
            <a class="reader" target="_blank" rel="noopener">
              <xsl:attribute name="href">https://www.inoreader.com/?add_feed=<xsl:value-of select="/rss/channel/atom:link/@href"/></xsl:attribute>
              <span class="reader-icon">&#128241;</span> Inoreader
            </a>
            <a class="reader" target="_blank" rel="noopener">
              <xsl:attribute name="href">https://theoldreader.com/feeds/subscribe?url=<xsl:value-of select="/rss/channel/atom:link/@href"/></xsl:attribute>
              <span class="reader-icon">&#128218;</span> The Old Reader
            </a>
            <a class="reader" href="/">
              <span class="reader-icon">&#127968;</span> Ir al sitio
            </a>
          </div>

          <div class="section-title">&#218;ltimas publicaciones (<xsl:value-of select="count(/rss/channel/item)"/>)</div>

          <xsl:for-each select="/rss/channel/item">
            <div class="item">
              <div class="item-meta">
                <span class="item-cat"><xsl:value-of select="category"/></span>
                <span class="item-date"><xsl:value-of select="pubDate"/></span>
              </div>
              <h3>
                <a target="_blank" rel="noopener">
                  <xsl:attribute name="href"><xsl:value-of select="link"/></xsl:attribute>
                  <xsl:value-of select="title"/>
                </a>
              </h3>
              <p class="item-desc"><xsl:value-of select="description"/></p>
              <a class="item-link" target="_blank" rel="noopener">
                <xsl:attribute name="href"><xsl:value-of select="link"/></xsl:attribute>
                Leer art&#237;culo completo &#8594;
              </a>
            </div>
          </xsl:for-each>

          <footer>
            &#169; Nicaragua Informate &#183; <a href="/">Ir al sitio principal</a> &#183; <a href="/contacto">Contacto</a>
          </footer>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
