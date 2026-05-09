@echo off
echo ========================================
echo Desplegando a Vercel via GitHub
echo ========================================

echo.
echo [1/4] Verificando estado de Git...
git status

echo.
echo [2/4] Agregando archivos...
git add .

echo.
echo [3/4] Creando commit...
git commit -m "Actualizar admin con APIs de Telegram y Facebook"

echo.
echo [4/4] Subiendo a GitHub...
git push origin main

echo.
echo ========================================
echo Listo! Vercel se actualizara automaticamente
echo Espera 1-2 minutos y verifica en:
echo https://informate-nicaragua.vercel.app
echo ========================================
pause
