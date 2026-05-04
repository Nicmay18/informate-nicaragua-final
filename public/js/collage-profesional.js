// ==========================================
// MARCA DE AGUA ESTILO COLLAGE PROFESIONAL
// INFORMATE AL INSTANTE NICARAGUA
// ==========================================

// Variable global para el tipo de collage seleccionado
window.tipoCollageSeleccionado = 'normal';

function crearCollageProfesional(ctx, width, height, opciones = {}) {
  const { 
    conLuto = false,  // Activar cinta de luto
    colorMarco = '#1a1a2e',
    colorBorde = '#00d4ff'
  } = opciones;

  const padding = Math.min(width, height) * 0.03;
  const esquinaSize = Math.min(width, height) * 0.12;

  ctx.save();

  // 1. FONDO DEGRADADO DEL MARCO
  const gradiente = ctx.createLinearGradient(0, 0, width, height);
  gradiente.addColorStop(0, '#0f172a');
  gradiente.addColorStop(0.5, '#1e293b');
  gradiente.addColorStop(1, '#0f172a');
  ctx.fillStyle = gradiente;
  ctx.fillRect(0, 0, width, height);

  // 2. MARCO INTERIOR (donde va la imagen)
  const marcoX = padding * 2;
  const marcoY = padding * 2 + (conLuto ? esquinaSize * 0.3 : 0);
  const marcoW = width - (padding * 4);
  const marcoH = height - (padding * 4) - (conLuto ? esquinaSize * 0.3 : 0);

  // Sombra del marco
  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 10;

  // Fondo del marco interior
  ctx.fillStyle = '#000000';
  ctx.fillRect(marcoX, marcoY, marcoW, marcoH);

  // Borde brillante del marco
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = colorBorde;
  ctx.lineWidth = 3;
  ctx.strokeRect(marcoX, marcoY, marcoW, marcoH);

  // Línea decorativa adicional
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  ctx.strokeRect(marcoX + 4, marcoY + 4, marcoW - 8, marcoH - 8);

  ctx.restore();

  // Retornar coordenadas para dibujar la imagen dentro del marco
  return {
    x: marcoX,
    y: marcoY,
    width: marcoW,
    height: marcoH,
    esquinaSize: esquinaSize
  };
}

function dibujarCintaLuto(ctx, x, y, size) {
  ctx.save();

  // Centro de la cinta
  const cx = x + size * 0.5;
  const cy = y + size * 0.3;

  // Degradado para la cinta
  const grad = ctx.createLinearGradient(cx - size/2, cy - size/2, cx + size/2, cy + size/2);
  grad.addColorStop(0, '#2d2d2d');
  grad.addColorStop(0.5, '#1a1a1a');
  grad.addColorStop(1, '#0d0d0d');

  // Sombra de la cinta
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 4;

  // Lazo izquierdo
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.quadraticCurveTo(cx - size * 0.4, cy - size * 0.6, cx - size * 0.5, cy - size * 0.2);
  ctx.quadraticCurveTo(cx - size * 0.3, cy + size * 0.1, cx, cy);
  ctx.fillStyle = grad;
  ctx.fill();

  // Lazo derecho
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.quadraticCurveTo(cx + size * 0.4, cy - size * 0.6, cx + size * 0.5, cy - size * 0.2);
  ctx.quadraticCurveTo(cx + size * 0.3, cy + size * 0.1, cx, cy);
  ctx.fillStyle = grad;
  ctx.fill();

  // Nudo central
  ctx.beginPath();
  ctx.ellipse(cx, cy, size * 0.12, size * 0.08, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#1a1a1a';
  ctx.fill();

  // Brillo en el nudo
  ctx.beginPath();
  ctx.ellipse(cx - size * 0.02, cy - size * 0.02, size * 0.04, size * 0.03, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.fill();

  // Colas de la cinta
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx - size * 0.15, cy + size * 0.7);
  ctx.lineTo(cx + size * 0.05, cy + size * 0.65);
  ctx.closePath();
  ctx.fillStyle = '#1a1a1a';
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + size * 0.15, cy + size * 0.7);
  ctx.lineTo(cx - size * 0.05, cy + size * 0.65);
  ctx.closePath();
  ctx.fillStyle = '#1a1a1a';
  ctx.fill();

  // Contorno sutil
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();
}

function dibujarLogoEsquina(ctx, x, y, size) {
  ctx.save();

  // Fondo circular del logo
  ctx.beginPath();
  ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2);

  // Degradado del círculo
  const grad = ctx.createRadialGradient(
    x + size/2, y + size/2, 0,
    x + size/2, y + size/2, size/2
  );
  grad.addColorStop(0, 'rgba(0, 212, 255, 0.15)');
  grad.addColorStop(1, 'rgba(0, 212, 255, 0.05)');
  ctx.fillStyle = grad;
  ctx.fill();

  // Borde del círculo
  ctx.strokeStyle = 'rgba(0, 212, 255, 0.4)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Texto "INFORMATE" curvado (simplificado)
  ctx.fillStyle = '#00d4ff';
  ctx.font = `bold ${size * 0.14}px 'Plus Jakarta Sans', Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;
  ctx.fillText('INFORMATE', x + size/2, y + size * 0.35);

  // Texto "AL INSTANTE" más grande
  ctx.fillStyle = '#ffffff';
  ctx.font = `900 ${size * 0.18}px 'Plus Jakarta Sans', Arial, sans-serif`;
  ctx.fillText('AL INSTANTE', x + size/2, y + size * 0.55);

  // Texto "NICARAGUA"
  ctx.fillStyle = '#00d4ff';
  ctx.font = `bold ${size * 0.14}px 'Plus Jakarta Sans', Arial, sans-serif`;
  ctx.fillText('NICARAGUA', x + size/2, y + size * 0.75);

  // Línea decorativa
  ctx.strokeStyle = 'rgba(0, 212, 255, 0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + size * 0.2, y + size * 0.82);
  ctx.lineTo(x + size * 0.8, y + size * 0.82);
  ctx.stroke();

  ctx.restore();
}

// ==========================================
// FUNCIÓN PRINCIPAL PARA PROCESAR IMAGEN
// ==========================================
async function procesarImagenConCollage(file, opciones = {}) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No se proporcionó archivo'));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      reject(new Error('La imagen excede 5MB máximo'));
      return;
    }

    const reader = new FileReader();
    
    reader.onload = (ev) => {
      const img = new Image();
      
      img.onload = () => {
        try {
          // Dimensiones del collage final
          const MAX = 1200;
          let w = img.width, h = img.height;

          // Mantener proporción pero con tamaño máximo
          if (w > MAX) {
            h = Math.round(h * MAX / w);
            w = MAX;
          }
          if (h > MAX) {
            w = Math.round(w * MAX / h);
            h = MAX;
          }

          const canvas = document.createElement('canvas');
          
          // Añadir espacio para el marco
          const paddingTotal = Math.min(w, h) * 0.08;
          canvas.width = w + paddingTotal * 2;
          canvas.height = h + paddingTotal * 2;

          const ctx = canvas.getContext('2d');

          // 1. Crear marco profesional
          const marco = crearCollageProfesional(ctx, canvas.width, canvas.height, {
            conLuto: opciones.conLuto || false,
            colorMarco: '#1a1a2e',
            colorBorde: '#00d4ff'
          });

          // 2. Dibujar imagen original dentro del marco
          ctx.drawImage(img, marco.x, marco.y, marco.width, marco.height);

          // 3. Si es luto, dibujar cinta
          if (opciones.conLuto) {
            const lutoX = marco.x + marco.width - marco.esquinaSize * 1.2;
            const lutoY = marco.y - marco.esquinaSize * 0.3;
            dibujarCintaLuto(ctx, lutoX, lutoY, marco.esquinaSize);
          }

          // 4. Dibujar logo en esquina inferior izquierda
          const logoSize = Math.min(canvas.width, canvas.height) * 0.18;
          const logoX = paddingTotal * 0.5;
          const logoY = canvas.height - logoSize - paddingTotal * 0.5;
          dibujarLogoEsquina(ctx, logoX, logoY, logoSize);

          // 5. Fecha en esquina inferior derecha (estilo profesional)
          ctx.save();
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.font = `600 ${logoSize * 0.12}px 'Plus Jakarta Sans', Arial, sans-serif`;
          ctx.textAlign = 'right';
          ctx.textBaseline = 'bottom';

          const ahora = new Date();
          const fechaStr = ahora.toLocaleDateString('es-NI', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          });
          const horaStr = ahora.toLocaleTimeString('es-NI', {
            hour: '2-digit',
            minute: '2-digit'
          });

          const fechaX = canvas.width - paddingTotal * 0.8;
          const fechaY = canvas.height - paddingTotal * 0.5;

          ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
          ctx.shadowBlur = 4;
          ctx.shadowOffsetX = 1;
          ctx.shadowOffsetY = 1;

          ctx.fillText(fechaStr, fechaX, fechaY - logoSize * 0.15);

          ctx.fillStyle = '#00d4ff';
          ctx.font = `700 ${logoSize * 0.14}px 'Plus Jakarta Sans', Arial, sans-serif`;
          ctx.fillText(horaStr, fechaX, fechaY);

          ctx.restore();

          // Convertir a JPEG con calidad alta
          canvas.toBlob((blob) => {
            resolve({
              blob: blob,
              preview: canvas.toDataURL('image/jpeg', 0.92),
              originalName: file.name,
              newName: file.name.replace(/\.[^.]+$/, '_collage.jpg')
            });
          }, 'image/jpeg', 0.92);

        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error('Error al cargar la imagen'));
      img.src = ev.target.result;
    };

    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    reader.readAsDataURL(file);
  });
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.procesarImagenConCollage = procesarImagenConCollage;
  window.crearCollageProfesional = crearCollageProfesional;
  window.dibujarCintaLuto = dibujarCintaLuto;
  window.dibujarLogoEsquina = dibujarLogoEsquina;
}
