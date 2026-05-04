// ============================================
// MARCA DE AGUA AUTOMÁTICA - INFORMATE AL INSTANTE NICARAGUA
// ============================================
class WatermarkManager {
  constructor(logoUrl) {
    this.logoUrl = logoUrl;
    this.logoImage = null;
    this.preloadLogo();
  }

  // Precargar el logo
  preloadLogo() {
    this.logoImage = new Image();
    this.logoImage.crossOrigin = "anonymous";
    this.logoImage.src = this.logoUrl;
  }

  // Cargar imagen desde File
  loadImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  // Agregar marca de agua
  async addWatermark(imageFile, options = {}) {
    const config = {
      position: options.position || 'bottom-right', // bottom-right, bottom-left, top-right, top-left, center
      size: options.size || 18, // Porcentaje del ancho (18%)
      opacity: options.opacity || 0.45, // 0.0 - 1.0 (45%)
      margin: options.margin || 20, // Pixeles de margen
      ...options
    };

    // Cargar imagen original
    const originalImage = await this.loadImage(imageFile);

    // Crear canvas
    const canvas = document.createElement('canvas');
    canvas.width = originalImage.width;
    canvas.height = originalImage.height;
    const ctx = canvas.getContext('2d');

    // Dibujar imagen original
    ctx.drawImage(originalImage, 0, 0);

    // Esperar a que el logo cargue
    if (!this.logoImage.complete) {
      await new Promise(resolve => {
        this.logoImage.onload = resolve;
      });
    }

    // Calcular tamaño del logo
    const logoWidth = (canvas.width * config.size) / 100;
    const logoHeight = (this.logoImage.height / this.logoImage.width) * logoWidth;

    // Calcular posición
    let x, y;
    switch(config.position) {
      case 'bottom-right':
        x = canvas.width - logoWidth - config.margin;
        y = canvas.height - logoHeight - config.margin;
        break;
      case 'bottom-left':
        x = config.margin;
        y = canvas.height - logoHeight - config.margin;
        break;
      case 'top-right':
        x = canvas.width - logoWidth - config.margin;
        y = config.margin;
        break;
      case 'top-left':
        x = config.margin;
        y = config.margin;
        break;
      case 'center':
        x = (canvas.width - logoWidth) / 2;
        y = (canvas.height - logoHeight) / 2;
        break;
    }

    // Aplicar transparencia y dibujar logo
    ctx.globalAlpha = config.opacity;
    ctx.drawImage(this.logoImage, x, y, logoWidth, logoHeight);
    ctx.globalAlpha = 1.0;

    // Retornar como Blob para subir al servidor
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve({
          blob: blob,
          preview: canvas.toDataURL('image/jpeg', 0.9),
          originalName: imageFile.name,
          newName: 'watermarked_' + imageFile.name
        });
      }, 'image/jpeg', 0.9);
    });
  }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.WatermarkManager = WatermarkManager;
}
