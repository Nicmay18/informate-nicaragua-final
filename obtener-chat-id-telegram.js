// ==========================================
// SCRIPT PARA OBTENER CHAT ID DE TELEGRAM
// ==========================================
// Uso: node obtener-chat-id-telegram.js <TOKEN_DEL_BOT>

const https = require('https');

const BOT_TOKEN = process.argv[2];

if (!BOT_TOKEN) {
  console.log('❌ Error: Debes proporcionar el token del bot');
  console.log('Uso: node obtener-chat-id-telegram.js <TOKEN_DEL_BOT>');
  console.log('');
  console.log('Pasos:');
  console.log('1. Obtén el token de tu bot en @BotFather');
  console.log('2. Agrega el bot a tu canal como administrador');
  console.log('3. Escribe un mensaje en el canal');
  console.log('4. Ejecuta este script con el token');
  process.exit(1);
}

console.log('🔍 Obteniendo updates del bot...');
console.log(`📡 Token: ${BOT_TOKEN.substring(0, 10)}...`);
console.log('');

const url = `https://api.telegram.org/bot${BOT_TOKEN}/getUpdates`;

https.get(url, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      
      if (response.ok) {
        if (response.result.length === 0) {
          console.log('⚠️  No hay mensajes recientes en el bot');
          console.log('');
          console.log('Solución:');
          console.log('1. Escribe un mensaje en tu canal');
          console.log('2. O envía un mensaje directo al bot');
          console.log('3. Vuelve a ejecutar este script');
          process.exit(0);
        }

        console.log('✅ Mensajes encontrados:');
        console.log('');
        
        const chatIds = new Set();
        
        response.result.forEach((update, index) => {
          const message = update.message;
          const channelPost = update.channel_post;
          
          if (message) {
            const chat = message.chat;
            const chatId = chat.id;
            const chatType = chat.type;
            const chatTitle = chat.title || chat.username || 'Desconocido';
            const chatUsername = chat.username || '';
            
            chatIds.add(chatId);
            
            console.log(`📨 Mensaje ${index + 1}:`);
            console.log(`   Chat ID: ${chatId}`);
            console.log(`   Tipo: ${chatType}`);
            console.log(`   Nombre: ${chatTitle}`);
            if (chatUsername) console.log(`   Username: @${chatUsername}`);
            console.log(`   Fecha: ${new Date(message.date * 1000).toLocaleString('es-NI')}`);
            console.log('');
          }
          
          if (channelPost) {
            const chat = channelPost.chat;
            const chatId = chat.id;
            const chatType = chat.type;
            const chatTitle = chat.title || chat.username || 'Desconocido';
            const chatUsername = chat.username || '';
            
            chatIds.add(chatId);
            
            console.log(`📢 Canal ${index + 1}:`);
            console.log(`   Chat ID: ${chatId}`);
            console.log(`   Tipo: ${chatType}`);
            console.log(`   Nombre: ${chatTitle}`);
            if (chatUsername) console.log(`   Username: @${chatUsername}`);
            console.log(`   Fecha: ${new Date(channelPost.date * 1000).toLocaleString('es-NI')}`);
            console.log('');
          }
        });

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📋 CHAT IDs ENCONTRADOS:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        chatIds.forEach(id => {
          console.log(`   ${id}`);
        });
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('');
        console.log('💡 Usa el Chat ID que comienza con -100 para canales');
        console.log('💡 Usa el Chat ID positivo para chats privados/grupos');
        
      } else {
        console.log('❌ Error de la API de Telegram:');
        console.log(`   ${response.description}`);
        console.log('');
        console.log('Posibles soluciones:');
        console.log('1. Verifica que el token sea correcto');
        console.log('2. El bot puede estar desactivado');
        console.log('3. Obtén un nuevo token en @BotFather');
      }
    } catch (error) {
      console.log('❌ Error al procesar la respuesta:', error.message);
    }
  });

}).on('error', (error) => {
  console.log('❌ Error de conexión:', error.message);
  console.log('');
  console.log('Verifica tu conexión a internet');
});
