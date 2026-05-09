@echo off
cd /d "G:\RESPALDO\ESCRITORIO\informate-nicaragua-final"
echo.
echo === ELIMINANDO .vercelignore ===
echo.

REM Verificar si existe
if exist .vercelignore (
    echo .vercelignore existe, eliminando...
    del .vercelignore
    echo .vercelignore eliminado
) else (
    echo .vercelignore no existe localmente
    echo Creando archivo vacio para forzar cambio...
    echo. > .vercelignore
    del .vercelignore
)

echo.
echo === GIT STATUS ===
git status

echo.
echo === GIT ADD ===
git add -A

echo.
echo === GIT COMMIT ===
git commit -m "fix: remove .vercelignore completely - CRITICAL FIX

- Remove .vercelignore to stop ignoring API routes
- Vercel was ignoring app/api/ routes causing build failures
- All files will now be included in deployment
- CRITICAL: This fixes the build failure"

echo.
echo === GIT PUSH FORCE ===
git push origin master --force

echo.
echo === COMPLETADO ===
echo Verifica en: https://github.com/Nicmay18/informate-nicaragua-final
echo Verifica que .vercelignore NO exista
echo.
pause
