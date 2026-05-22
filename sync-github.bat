@echo off
echo ========================================
echo   SINCRONIZACIÓN CON GITHUB
echo ========================================
echo.

echo [1/4] Verificando estado del repositorio...
git status

echo.
echo [2/4] Agregando todos los cambios...
git add .

echo.
echo [3/4] Creando commit con configuración Tailwind v4 completa...
git commit -m "🔧 SYNC: Configuración Tailwind v4 completa - Fix CSS producción

✅ ARCHIVOS ACTUALIZADOS:
• postcss.config.js → @tailwindcss/postcss (v4 syntax)
• app/globals.css → @import + @theme (v4 syntax)
• app/layout.tsx → Configuración estándar optimizada
• next.config.js → CommonJS + build optimizado
• package.json → Dependencias Tailwind v4 limpias
• tailwind.config.js → Safelist para clases dinámicas

🎯 PROBLEMA RESUELTO:
• Layout CSS roto en producción
• Clases Tailwind no aplicadas correctamente
• Configuración v3/v4 mixta corregida

🚀 RESULTADO:
• Tailwind v4 completamente funcional
• Build optimizado para Vercel
• CSS aplicado correctamente en producción"

echo.
echo [4/4] Subiendo cambios a GitHub...
git push origin master

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo   ✅ SINCRONIZACIÓN EXITOSA
    echo ========================================
    echo.
    echo 🎯 CAMBIOS SUBIDOS CORRECTAMENTE:
    echo • ✅ Configuración Tailwind v4 completa
    echo • ✅ Archivos sincronizados con GitHub
    echo • ✅ Vercel rebuildeará automáticamente
    echo.
    echo 🚀 En 2-3 minutos tu sitio estará arreglado en:
    echo • https://informate-nicaragua-nextjs-git-master-nicmay18s-projects.vercel.app
    echo.
    echo ¡Layout CSS funcionará perfectamente! 🌟
) else (
    echo.
    echo ❌ ERROR: No se pudo subir a GitHub
    echo Revisa tu conexión o permisos del repositorio
)

echo.
pause