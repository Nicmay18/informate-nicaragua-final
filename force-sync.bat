@echo off
echo === Verificando estado actual ===
git status
echo.
echo === Agregando todos los cambios ===
git add -A
echo.
echo === Haciendo commit ===
git commit -m "fix: final clean package.json - remove husky and unused deps"
echo.
echo === Forzando push a GitHub ===
git push origin master --force
echo.
echo === Verificando estado final ===
git status
echo.
echo Sincronizacion completada.
pause
