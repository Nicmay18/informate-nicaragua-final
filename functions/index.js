/**
 * Cloud Functions para Nicaragua Informate
 * Sistema de Newsletter + Patrocinios + Analytics + APIs de Publicación
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { Resend } = require('resend');

admin.initializeApp();
const db = admin.firestore();
const resend = new Resend(functions.config().resend?.api_key || 'dummy');

// ========== APIs DE PUBLICACIÓN ==========

/**
 * API: Publicar en Telegram
 */
exports.telegram = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { noticia, config } = req.body || {};
    
    // Usar tokens del config (desde admin) o del .env (fallback)
    const TG_TOKEN = config?.telegram?.token || functions.config().telegram?.token;
    const TG_CHAT_ID = config?.telegram?.chatId || functions.config().telegram?.chat_id;

    if (!TG_TOKEN || !TG_CHAT_ID) {
      return res.status(400).json({ error: 'Telegram no configurado' });
    }

    if (!noticia?.titulo) {
      return res.status(400).json({ error: 'Falta título' });
    }

    const emoji = {
      'Sucesos': '🚨', 'Nacionales': '🇳🇮', 'Economía': '💰', 'Cultura': '🎨',
      'Espectáculos': '⭐', 'Deportes': '⚽', 'Tecnología': '💻', 'Internacionales': '🌍'
    };

    const titulo = (noticia.titulo || '').substring(0, 200);
    const resumenCompleto = noticia.resumen || noticia.contenido || '';
    let resumen = resumenCompleto.substring(0, 300);
    const ultimoPunto = resumen.lastIndexOf('.');
    if (ultimoPunto > 100) resumen = resumen.substring(0, ultimoPunto + 1);
    const cat = (noticia.categoria?.toUpperCase() || 'NOTICIA').substring(0, 30);
    const slug = noticia.slug || noticia.id || Date.now().toString(36);
    const url = noticia.slug
      ? `https://nicaraguainformate.com/noticia/${noticia.slug}`
      : `https://nicaraguainformate.com/noticia.html?id=${noticia.id}`;

    const text = `${emoji[noticia.categoria] || '📰'} *${cat}*\n\n*${titulo}*\n\n${resumen}\n\n🔗 [Leer noticia completa](${url})`;

    let telegramUrl, body;
    
    if (noticia.imagen) {
      telegramUrl = `https://api.telegram.org/bot${TG_TOKEN}/sendPhoto`;
      body = {
        chat_id: TG_CHAT_ID,
        photo: noticia.imagen,
        caption: text.slice(0, 1024),
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[{ text: "📰 Leer noticia completa", url: url }]]
        }
      };
    } else {
      telegramUrl = `https://api.telegram.org/bot${TG_TOKEN}/sendMessage`;
      body = {
        chat_id: TG_CHAT_ID,
        text: text.slice(0, 4096),
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[{ text: "📰 Leer noticia completa", url: url }]]
        }
      };
    }

    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (!data.ok) {
      return res.status(500).json({ 
        error: 'Telegram API error', 
        details: data.description 
      });
    }

    return res.status(200).json({ 
      success: true, 
      messageId: data.result.message_id 
    });

  } catch (e) {
    console.error('[Telegram] Error:', e);
    return res.status(500).json({ error: e.message });
  }
});

/**
 * API: Publicar en Facebook
 */
exports.facebook = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { noticia, config } = req.body;
    
    // Usar tokens del config (desde admin) o del .env (fallback)
    const FB_PAGE_ACCESS_TOKEN = config?.facebook?.page1?.token || functions.config().facebook?.token;
    const FB_PAGE_ID = config?.facebook?.page1?.id || functions.config().facebook?.page_id || '741453509043658';
    const FB_PAGE_2_TOKEN = config?.facebook?.page2?.token || functions.config().facebook?.token;
    const FB_PAGE_2_ID = config?.facebook?.page2?.id || '';

    if (!FB_PAGE_ACCESS_TOKEN) {
      return res.status(500).json({ error: 'Token no configurado' });
    }

    const mensaje = `${noticia.titulo}\n\n${noticia.resumen || noticia.contenido?.substring(0, 500) || ''}\n\n#${(noticia.categoria || 'Noticias').replace(/\s+/g, '')} #Nicaragua #InformateAlInstante`;
    const esBase64 = (noticia.imagen || '').startsWith('data:');
    const tieneUrl = noticia.imagen && !esBase64;
    
    const results = [];

    // Publicar en Página 1
    const fbUrl1 = tieneUrl
      ? `https://graph.facebook.com/v18.0/${FB_PAGE_ID}/photos`
      : `https://graph.facebook.com/v18.0/${FB_PAGE_ID}/feed`;
    const body1 = tieneUrl
      ? { url: noticia.imagen, caption: mensaje, access_token: FB_PAGE_ACCESS_TOKEN }
      : { message: mensaje, access_token: FB_PAGE_ACCESS_TOKEN };
    
    const r1 = await fetch(fbUrl1, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(body1) 
    });
    const data1 = await r1.json();

    console.log('[FB Page 1] Respuesta:', JSON.stringify(data1));

    if (data1.id) {
      results.push({ pageId: FB_PAGE_ID, postId: data1.id, status: 'published' });
    } else {
      results.push({ pageId: FB_PAGE_ID, status: 'error', details: data1 });
    }

    // Publicar en Página 2 si está configurada
    if (FB_PAGE_2_ID && FB_PAGE_2_TOKEN) {
      const fbUrl2 = tieneUrl
        ? `https://graph.facebook.com/v18.0/${FB_PAGE_2_ID}/photos`
        : `https://graph.facebook.com/v18.0/${FB_PAGE_2_ID}/feed`;
      const body2 = tieneUrl
        ? { url: noticia.imagen, caption: mensaje, access_token: FB_PAGE_2_TOKEN }
        : { message: mensaje, access_token: FB_PAGE_2_TOKEN };
      
      const r2 = await fetch(fbUrl2, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(body2) 
      });
      const data2 = await r2.json();

      console.log('[FB Page 2] Respuesta:', JSON.stringify(data2));

      if (data2.id) {
        results.push({ pageId: FB_PAGE_2_ID, postId: data2.id, status: 'published' });
      } else {
        results.push({ pageId: FB_PAGE_2_ID, status: 'error', details: data2 });
      }
    }

    return res.json({ success: true, results });
  } catch (error) {
    console.error('[FB] Error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// ========== TRIGGERS AUTOMÁTICOS ==========

/**
 * Trigger: Nuevo artículo publicado → Newsletter breaking (si es importante)
 */
exports.onArticlePublished = functions.firestore
  .document('noticias/{articleId}')
  .onCreate(async (snap, context) => {
    const article = snap.data();
    
    // Solo noticias "breaking" o muy populares
    if (!isBreakingNews(article)) return null;
    
    // Crear campaña breaking
    const campaignRef = db.collection('newsletter_campaigns').doc();
    await campaignRef.set({
      type: 'breaking',
      status: 'scheduled',
      subject: `🚨 ÚLTIMA HORA: ${truncate(article.titulo, 60)}`,
      content: {
        articles: [context.params.articleId],
        template: 'breaking'
      },
      scheduledFor: admin.firestore.Timestamp.now(),
      createdAt: admin.firestore.Timestamp.now()
    });
    
    // Enviar inmediatamente a suscriptores de "breaking_only"
    return sendBreakingNews(campaignRef.id, article);
  });

function isBreakingNews(article) {
  const breakingCategories = ['Sucesos', 'Nacionales'];
  const isBreaking = breakingCategories.includes(article.categoria);
  const isImportant = article.importance === 'alta' ||
                      article.titulo?.toLowerCase().includes('muerte') ||
                      article.titulo?.toLowerCase().includes('accidente');
  return isBreaking && isImportant;
}

function truncate(str, length) {
  return str.length > length ? str.substring(0, length) + '...' : str;
}

/**
 * Scheduled Function: Newsletter diaria 7:00 AM
 */
exports.dailyNewsletter = functions.pubsub
  .schedule('0 7 * * *') // 7:00 AM todos los días
  .timeZone('America/Managua')
  .onRun(async (context) => {
    // Obtener artículos de las últimas 24 horas
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const articlesSnap = await db.collection('noticias')
      .where('fecha', '>=', yesterday)
      .orderBy('fecha', 'desc')
      .limit(10)
      .get();
    
    const articles = articlesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    
    if (articles.length === 0) {
      console.log('No hay artículos para newsletter de hoy');
      return null;
    }
    
    // Seleccionar patrocinador del día
    const sponsor = await selectDailySponsor();
    
    // Crear campaña
    const campaignRef = db.collection('newsletter_campaigns').doc();
    await campaignRef.set({
      type: 'daily',
      status: 'sending',
      subject: `📰 Resumen del ${formatDate(new Date())}: ${articles[0].titulo}`,
      content: {
        articles: articles.map(a => a.id),
        sponsorSlot: sponsor,
        template: 'daily'
      },
      sentAt: admin.firestore.Timestamp.now(),
      stats: { recipients: 0, delivered: 0, opened: 0, clicked: 0 }
    });
    
    return executeCampaign(campaignRef.id);
  });

function formatDate(date) {
  return date.toLocaleDateString('es-NI', { 
    day: 'numeric', 
    month: 'long' 
  });
}

async function selectDailySponsor() {
  const sponsorsSnap = await db.collection('newsletter_sponsors')
    .where('status', '==', 'active')
    .where('budget', '>', 0)
    .limit(1)
    .get();
  
  if (sponsorsSnap.empty) return null;
  
  const sponsor = sponsorsSnap.docs[0].data();
  return {
    id: sponsorsSnap.docs[0].id,
    brand: sponsor.brand,
    message: sponsor.message,
    url: sponsor.url,
    cta: sponsor.cta
  };
}

// ========== FUNCIONES DE ENVÍO ==========

async function executeCampaign(campaignId) {
  const campaignRef = db.collection('newsletter_campaigns').doc(campaignId);
  const campaign = (await campaignRef.get()).data();
  
  // Obtener suscriptores según preferencias
  let subscribersQuery = db.collection('newsletter_subscribers')
    .where('status', '==', 'active');
  
  if (campaign.type === 'daily') {
    subscribersQuery = subscribersQuery
      .where('preferences.frequency', 'in', ['daily', 'weekly']);
  } else if (campaign.type === 'breaking') {
    subscribersQuery = subscribersQuery
      .where('preferences.frequency', 'in', ['breaking', 'daily']);
  }
  
  // Batch processing
  const BATCH_SIZE = 100;
  let lastDoc = null;
  let totalSent = 0;
  
  while (true) {
    let query = subscribersQuery.limit(BATCH_SIZE);
    if (lastDoc) query = query.startAfter(lastDoc);
    
    const batch = await query.get();
    if (batch.empty) break;
    
    // Preparar emails personalizados
    const emails = await Promise.all(
      batch.docs.map(async doc => {
        const subscriber = doc.data();
        const personalized = await personalizeContent(campaign, subscriber);
        return {
          from: 'Nicaragua Informate <resumen@nicaraguainformate.com>',
          to: subscriber.email,
          subject: campaign.subject,
          html: personalized.html,
          tags: [{ name: 'campaign_id', value: campaignId }],
          headers: {
            'X-Subscriber-ID': doc.id,
            'X-Campaign-ID': campaignId
          }
        };
      })
    );
    
    // Enviar batch
    try {
      const result = await resend.batch.send(emails);
      
      totalSent += emails.length;
      await campaignRef.update({
        'stats.recipients': totalSent,
        'stats.delivered': admin.firestore.FieldValue.increment(result.data.length)
      });
      
    } catch (error) {
      console.error('Error enviando batch:', error);
    }
    
    lastDoc = batch.docs[batch.docs.length - 1];
    await new Promise(r => setTimeout(r, 1000));
  }
  
  await campaignRef.update({
    status: 'sent',
    'stats.recipients': totalSent,
    completedAt: admin.firestore.Timestamp.now()
  });
  
  return { success: true, sent: totalSent };
}

async function personalizeContent(campaign, subscriber) {
  const articles = await Promise.all(
    campaign.content.articles.map(id =>
      db.collection('noticias').doc(id).get().then(d => ({ id, ...d.data() }))
    )
  );
  
  const template = getTemplate(campaign.content.template);
  const html = template({
    subscriber,
    articles,
    sponsor: campaign.content.sponsorSlot,
    date: new Date()
  });
  
  return { html };
}

function getTemplate(type) {
  return (data) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: system-ui, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8fafc; }
    .header { text-align: center; padding: 20px 0; border-bottom: 3px solid #3b82f6; }
    .logo { font-size: 24px; font-weight: 800; color: #1e293b; }
    .article { background: #fff; border-radius: 12px; padding: 24px; margin: 16px 0; }
    .title { font-size: 20px; font-weight: 700; margin-bottom: 12px; }
    .cta { display: inline-block; background: #3b82f6; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">🇳🇮 Nicaragua Informate</div>
  </div>
  ${data.articles.map(article => `
    <div class="article">
      <h2 class="title">${article.titulo}</h2>
      <p>${article.resumen || ''}</p>
      <a href="${article.slug ? `https://nicaraguainformate.com/noticia/${article.slug}` : `https://nicaraguainformate.com/noticia.html?id=${article.id}`}" class="cta">Leer completo →</a>
    </div>
  `).join('')}
</body>
</html>`;
}

async function sendBreakingNews(campaignId, article) {
  console.log('Sending breaking news:', campaignId);
  return executeCampaign(campaignId);
}

// ========== WEBHOOKS ==========

exports.resendWebhook = functions.https.onRequest(async (req, res) => {
  const { type, email, tags } = req.body;
  const campaignId = tags?.find(t => t.name === 'campaign_id')?.value;
  
  if (!campaignId) return res.status(400).send('Missing campaign_id');
  
  const campaignRef = db.collection('newsletter_campaigns').doc(campaignId);
  
  switch (type) {
    case 'email.opened':
      await campaignRef.update({ 
        'stats.opened': admin.firestore.FieldValue.increment(1) 
      });
      break;
    case 'email.clicked':
      await campaignRef.update({ 
        'stats.clicked': admin.firestore.FieldValue.increment(1) 
      });
      break;
  }
  
  res.status(200).send('OK');
});
