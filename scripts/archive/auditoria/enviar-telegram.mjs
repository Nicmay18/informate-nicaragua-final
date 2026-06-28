/**
 * Enviar noticia a Telegram manualmente
 * Usa la API interna: POST /api/telegram
 */

const NOTICIA = {
  titulo: "Tres accidentes de tránsito dejan lesionados en Managua y Boaco",
  resumen: "Tres incidentes de tránsito fueron reportados en Managua y Boaco. Gabriel Silva, de 18 años, resultó lesionado tras ser impactado en la capital, Alejandro Gutiérrez chocó contra un camión, y un Jeep se volcó en Camoapa sin lesionados graves.",
  categoria: "Sucesos",
  slug: "tres-accidentes-transito-managua-boaco-lesionados",
  imagen: "https://images.unsplash.com/photo-1542282088-fe8426682b8f?w=1200&q=80"
};

async function main() {
  try {
    const response = await fetch('https://nicaraguainformate.com/api/telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ noticia: NOTICIA })
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ Enviado a Telegram. Message ID:', data.messageId);
    } else {
      console.log('❌ Error:', data.error);
      console.log('Detalles:', data.details || data.suggestion || 'N/A');
    }
  } catch (err) {
    console.error('❌ Error de red:', err.message);
  }
}

main();
