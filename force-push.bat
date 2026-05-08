@echo off
echo Forzando sincronizacion con GitHub...
git add -A
git commit -m "fix: remove husky prepare script - final clean package.json"
git push origin master --force
echo Sincronizacion completada.
pause
