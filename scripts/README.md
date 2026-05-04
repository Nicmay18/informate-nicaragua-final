# 🛠️ Scripts de Mantenimiento

## 📁 Archivos

| Archivo | Descripción |
|---------|-------------|
| `limpiar-imagenes-nan.js` | Script Node.js para corregir noticias con imagen="NaN" en Firestore |
| `CORREGIR-ADMIN-VALIDACION.txt` | Instrucciones para agregar validación al admin |

---

## 🚨 PROBLEMA ACTUAL

**144 noticias** en Firestore tienen `imagen: "NaN"` (string literal).

Esto causa que el frontend muestre imágenes fallback de picsum en lugar de las reales.

---

## 🔧 SOLUCIÓN RÁPIDA (3 pasos)

### PASO 1: Limpiar Firestore (una vez)

```bash
cd "g:\RESPALDO\ESCRITORIO\Curso NoelCode\informate-nicaragua\informate-nicaragua-main"

# Necesitas el serviceAccountKey.json de Firebase
node scripts/limpiar-imagenes-nan.js
```

**Resultado:** Las noticias con "NaN" recibirán un placeholder como `placeholder_sucesos.webp`

---

### PASO 2: Corregir el Admin (para evitar futuros "NaN")

Ver archivo: `CORREGIR-ADMIN-VALIDACION.txt`

Resumen:
1. Abre tu admin (`index(1).html`)
2. Agrega validación anti-NaN en `guardarNoticia()`
3. Mejora `subirCollageServidor()` para guardar solo el nombre

---

### PASO 3: Subir imágenes reales a GitHub

1. Ve a https://github.com/Nicmay18/informate-nicaragua
2. Navega: `informate-nicaragua-main/public/images/`
3. "Add file" → "Upload files"
4. Sube tus imágenes .webp
5. Espera 5-10 minutos a que se actualice el CDN

---

## 📝 Estructura correcta

**En Firestore (campo `imagen`):**
```javascript
// ✅ CORRECTO - Solo nombre
"collage_1234567890_abcd1234.webp"

// ❌ INCORRECTO - URL completa (no usar)
"https://raw.githubusercontent.com/..."

// ❌ INCORRECTO - Base64 (NUNCA)
"data:image/jpeg;base64,/9j/4AAQ..."

// ❌ INCORRECTO - NaN
"NaN"
```

**URL construida por frontend:**
```
https://raw.githubusercontent.com/Nicmay18/informate-nicaragua/main/informate-nicaragua-main/public/images/collage_1234567890_abcd1234.webp
```

---

## 🎯 Prioridad

1. **ALTA:** Ejecutar `limpiar-imagenes-nan.js` ahora
2. **MEDIA:** Corregir admin (para noticias nuevas)
3. **BAJA:** Subir imágenes reales a GitHub

---

## ❓ ¿Necesitas ayuda?

- ¿No tienes `serviceAccountKey.json`? → Ve a Firebase Console → Configuración → Cuentas de servicio
- ¿El admin está en otra computadora? → Copia el archivo `CORREGIR-ADMIN-VALIDACION.txt`
- ¿Dudas? → Revisa los comentarios en cada archivo
