@echo off
echo ==========================================
echo  CONSOLIDANDO APIS PARA VERCEL HOBBY
echo ==========================================
echo.

cd /d "g:\RESPALDO\ESCRITORIO\Curso NoelCode\informate-nicaragua"

echo [1] Eliminando archivos individuales...
if exist api\gifts\create-gift.js del api\gifts\create-gift.js
if exist api\gifts\claim-gift.js del api\gifts\claim-gift.js
if exist api\experiments\assign-variant.js del api\experiments\assign-variant.js
if exist api\experiments\conversion.js del api\experiments\conversion.js
if exist api\subscription\status.js del api\subscription\status.js
if exist api\webhooks\stripe.js del api\webhooks\stripe.js
if exist api\create-checkout-session.js del api\create-checkout-session.js
if exist api\server.js del api\server.js
if exist api\gifts.js del api\gifts.js
if exist api\experiments.js del api\experiments.js

echo [2] Renombrando archivos consolidados...
if exist api\gifts-index.js ren api\gifts-index.js gifts.js
if exist api\experiments-index.js ren api\experiments-index.js experiments.js
if exist api\subscription-index.js ren api\subscription-index.js subscription.js

echo [3] Verificando archivos finales...
dir api\*.js /b

echo.
echo ==========================================
echo  PROCESO COMPLETADO
echo ==========================================
echo.
echo Ahora ejecuta:
echo   git add -A
echo   git commit -m "fix: Consolidar APIs para Vercel Hobby"
echo   git push origin main
echo.
pause
