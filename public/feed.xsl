<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:atom="http://www.w3.org/2005/Atom">
  
  <xsl:output method="html" encoding="UTF-8" indent="yes" doctype-system="about:legacy-compat"/>

  <xsl:template match="/">
    <html lang="es">
      <head>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title><xsl:value-of select="rss/channel/title"/> — Feed RSS</title>
        <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23f26522' d='M19.199 24C19.199 13.467 10.533 4.8 0 4.8V0c13.165 0 24 10.835 24 24h-4.801zM3.291 17.415a3.3 3.3 0 0 1 3.293 3.295A3.305 3.305 0 0 1 3.283 24C1.47 24 0 22.526 0 20.71s1.475-3.295 3.291-3.295zM15.909 24h-4.665c0-6.946-5.636-12.587-12.596-12.587V6.748c9.52 0 17.261 7.76 17.261 17.252z'/%3E%3C/svg%3E"/>
        <style>
          :root {
            --brand: #9e1b1b;
            --brand-light: #b91c1c;
            --bg: #fafafa;
            --card: #ffffff;
            --text: #111827;
            --muted: #6b7280;
            --border: #e5e7eb;
            --radius: 12px;
            --shadow: 0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.05);
          }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background: var(--bg);
            color: var(--text);
            line-height: 1.6;
            padding-bottom: 60px;
          }
          .container { max-width: 800px; margin: 0 auto; padding: 0 20px; }

          /* HEADER */
          .header {
            background: linear-gradient(135deg, #9e1b1b 0%, #7f1d1d 100%);
            color: #fff;
            padding: 40px 32px;
            border-radius: 0 0 var(--radius) var(--radius);
            margin-bottom: 32px;
            box-shadow: 0 10px 30px rgba(158,27,27,0.25);
          }
          .header-badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            opacity: 0.9;
            margin-bottom: 16px;
          }
          .header-badge::before {
            content: "";
            width: 8px; height: 8px;
            background: #fbbf24;
            border-radius: 50%;
            box-shadow: 0 0 8px #fbbf24;
          }
          .header h1 {
            font-family: Georgia, "Times New Roman", serif;
            font-size: 36px;
            font-weight: 700;
            letter-spacing: -0.02em;
            line-height: 1.2;
            margin-bottom: 10px;
          }
          .header p {
            font-size: 15px;
            opacity: 0.85;
            max-width: 500px;
          }

          /* INFO BOX */
          .info-box {
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            padding: 24px;
            margin-bottom: 28px;
            box-shadow: var(--shadow);
            display: flex;
            gap: 16px;
            align-items: flex-start;
          }
          .info-icon {
            width: 44px; height: 44px;
            background: #fef2f2;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }
          .info-icon svg { width: 22px; height: 22px; fill: var(--brand); }
          .info-content h2 {
            font-size: 15px;
            font-weight: 700;
            margin-bottom: 6px;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .info-content .xml-tag {
            background: #fef3c7;
            color: #92400e;
            font-size: 10px;
            font-weight: 800;
            padding: 2px 6px;
            border-radius: 4px;
            letter-spacing: 0.05em;
          }
          .info-content p {
            font-size: 13.5px;
            color: var(--muted);
            line-height: 1.6;
            margin-bottom: 12px;
          }
          .url-box {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: #f3f4f6;
            border: 1px solid var(--border);
            padding: 6px 12px;
            border-radius: 6px;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            font-size: 12px;
            color: #374151;
            word-break: break-all;
          }

          /* SUBSCRIBE */
          .subscribe-title {
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            color: var(--brand);
            margin-bottom: 14px;
            padding-bottom: 10px;
            border-bottom: 1px solid var(--border);
          }
          .subscribe-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
            gap: 10px;
            margin-bottom: 32px;
          }
          .sub-btn {
            display: flex;
            align-items: center;
            gap: 10px;
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 10px 14px;
            font-size: 13px;
            font-weight: 600;
            color: var(--text);
            text-decoration: none;
            transition: all 0.2s ease;
            cursor: pointer;
          }
          .sub-btn:hover {
            border-color: var(--brand);
            box-shadow: 0 2px 8px rgba(158,27,27,0.08);
            transform: translateY(-1px);
          }
          .sub-btn svg { width: 18px; height: 18px; flex-shrink: 0; }

          /* ARTICLES */
          .section-title {
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            color: var(--brand);
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .section-title::after {
            content: "";
            flex: 1;
            height: 1px;
            background: var(--border);
          }
          .article {
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            padding: 24px;
            margin-bottom: 16px;
            box-shadow: var(--shadow);
            transition: box-shadow 0.2s ease, transform 0.2s ease;
          }
          .article:hover {
            box-shadow: 0 8px 24px rgba(0,0,0,0.08);
            transform: translateY(-2px);
          }
          .article-meta {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 12px;
            flex-wrap: wrap;
          }
          .category {
            background: var(--brand);
            color: #fff;
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            padding: 4px 10px;
            border-radius: 4px;
          }
          .date {
            font-size: 12px;
            color: var(--muted);
            font-weight: 500;
          }
          .article h2 {
            font-family: Georgia, "Times New Roman", serif;
            font-size: 20px;
            font-weight: 700;
            line-height: 1.3;
            margin-bottom: 10px;
            color: var(--text);
          }
          .article h2 a {
            color: inherit;
            text-decoration: none;
          }
          .article h2 a:hover { color: var(--brand); }
          .article p.desc {
            font-size: 14px;
            color: #4b5563;
            line-height: 1.65;
            margin-bottom: 14px;
          }
          .read-more {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-size: 13px;
            font-weight: 600;
            color: var(--brand);
            text-decoration: none;
          }
          .read-more:hover { text-decoration: underline; }

          /* FOOTER */
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 24px;
            border-top: 1px solid var(--border);
            font-size: 12px;
            color: var(--muted);
          }

          @media (max-width: 640px) {
            .header { padding: 28px 20px; }
            .header h1 { font-size: 26px; }
            .article { padding: 18px; }
            .article h2 { font-size: 17px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="container">
            <div class="header-badge">Feed RSS · Actualizado en tiempo real</div>
            <h1><xsl:value-of select="rss/channel/title"/></h1>
            <p><xsl:value-of select="rss/channel/description"/></p>
          </div>
        </div>

        <div class="container">
          <!-- INFO -->
          <div class="info-box">
            <div class="info-icon">
              <svg viewBox="0 0 24 24"><path d="M19.199 24C19.199 13.467 10.533 4.8 0 4.8V0c13.165 0 24 10.835 24 24h-4.801zM3.291 17.415a3.3 3.3 0 0 1 3.293 3.295A3.305 3.305 0 0 1 3.283 24C1.47 24 0 22.526 0 20.71s1.475-3.295 3.291-3.295zM15.909 24h-4.665c0-6.946-5.636-12.587-12.596-12.587V6.748c9.52 0 17.261 7.76 17.261 17.252z"/></svg>
            </div>
            <div class="info-content">
              <h2>Estás viendo un feed RSS <span class="xml-tag">XML</span></h2>
              <p>Esta página es un <strong>feed de noticias</strong> para suscriptores automáticos. Copia esta URL en tu lector de RSS favorito (Feedly, Inoreader, Thunderbird, NetNewsWire) para recibir las últimas noticias de Nicaragua automáticamente:</p>
              <div class="url-box">
                <xsl:value-of select="rss/channel/atom:link/@href"/>
              </div>
            </div>
          </div>

          <!-- SUBSCRIBE BUTTONS -->
          <div class="subscribe-title">Suscribirse con un lector</div>
          <div class="subscribe-grid">
            <a class="sub-btn" href="https://feedly.com/i/subscription/feed/{rss/channel/atom:link/@href}" target="_blank" rel="noopener">
              <svg viewBox="0 0 24 24" fill="#2bb24c"><path d="M13.8 4.4L9.2 9h2.9v4.2h3.8V9h2.9l-4.6-4.6zM4 13.2V19c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-5.8h-3.8V19H7.8v-5.8H4z"/></svg>
              Feedly
            </a>
            <a class="sub-btn" href="https://www.inoreader.com/feed/{rss/channel/atom:link/@href}" target="_blank" rel="noopener">
              <svg viewBox="0 0 24 24" fill="#1875f3"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm0-8h-2V7h2v2zm4 8h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
              Inoreader
            </a>
            <a class="sub-btn" href="https://theoldreader.com/feeds/subscribe?url={rss/channel/atom:link/@href}" target="_blank" rel="noopener">
              <svg viewBox="0 0 24 24" fill="#ff6c00"><path d="M12 4.5C7 4.5 2.7 7.6 1 12c1.7 4.4 6 7.5 11 7.5s9.3-3.1 11-7.5c-1.7-4.4-6-7.5-11-7.5zm0 12.5c-2.8 0-5-2.2-5-5s2.2-5 5-5 5 2.2 5 5-2.2 5-5 5zm0-8c-1.7 0-3 1.3-3 3s1.3 3 3 3 3-1.3 3-3-1.3-3-3-3z"/></svg>
              The Old Reader
            </a>
            <a class="sub-btn" href="{rss/channel/link}" target="_blank" rel="noopener">
              <svg viewBox="0 0 24 24" fill="#6b7280"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
              Ir al sitio
            </a>
          </div>

          <!-- ARTICLES -->
          <div class="section-title">Últimas publicaciones (<xsl:value-of select="count(rss/channel/item)"/>)</div>
          <xsl:for-each select="rss/channel/item">
            <article class="article">
              <div class="article-meta">
                <span class="category"><xsl:value-of select="category"/></span>
                <span class="date"><xsl:value-of select="pubDate"/></span>
              </div>
              <h2><a href="{link}" target="_blank" rel="noopener"><xsl:value-of select="title"/></a></h2>
              <p class="desc"><xsl:value-of select="description"/></p>
              <a class="read-more" href="{link}" target="_blank" rel="noopener">
                Leer artículo completo →
              </a>
            </article>
          </xsl:for-each>

          <div class="footer">
            <p>© <xsl:value-of select="rss/channel/title"/> — Feed RSS generado automáticamente.</p>
          </div>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
