export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({error: 'Method not allowed'});
  
  const { platform, message, image, link, page } = req.body;
  
  try {
    // Aquí integras las APIs reales:
    // - Facebook Graph API (requiere token de página)
    // - WhatsApp Business API (Meta)
    // - Telegram Bot API
    
    // Ejemplo para Telegram (más fácil):
    if (platform === 'telegram') {
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      const chatId = process.env.TELEGRAM_CHANNEL_ID;
      
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'Markdown'
        })
      });
    }
    
    res.status(200).json({success: true});
  } catch (error) {
    res.status(500).json({error: error.message});
  }
}