@echo off
echo ==========================================
echo LIMPIAR IMAGENES NaN EN FIRESTORE
echo ==========================================
echo.
echo Este script corrige las noticias con imagen="NaN"
echo.

cd "g:\RESPALDO\ESCRITORIO\Curso NoelCode\informate-nicaragua\informate-nicaragua-main"

echo Verificando serviceAccountKey.json...
if not exist "serviceAccountKey.json" (
    echo.
    echo ❌ ERROR: No se encontro serviceAccountKey.json
    echo.
    echo Para obtenerlo:
    echo 1. Ve a https://console.firebase.google.com
    echo 2. Tu proyecto → ⚙️ Configuracion → Cuentas de servicio
    echo 3. Generar nueva clave privada
    echo 4. Guardar como serviceAccountKey.json en la carpeta raiz
    echo.
    pause
    exit /b 1
)

echo ✅ serviceAccountKey.json encontrado
echo.
echo Ejecutando limpieza...
echo.

node scripts\limpiar-imagenes-nan.js

echo.
pause
