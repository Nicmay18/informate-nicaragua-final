# Script para reconstruir el repo git y subir cambios
$ErrorActionPreference = "Stop"
$repo = "G:\RESPALDO\ESCRITORIO\Curso NoelCode\informate-nicaragua\informate-nicaragua-main"
$temp = "G:\RESPALDO\ESCRITORIO\Curso NoelCode\informate-nicaragua\temp-fixes"

Write-Host "=== Rebuild Git Repo ===" -ForegroundColor Cyan

# 1. Borrar .git corrupto si existe
if (Test-Path "$repo\.git") {
    Write-Host "Borrando .git antiguo..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "$repo\.git"
}

# 2. Inicializar repo
Write-Host "Inicializando git..." -ForegroundColor Green
cd "$repo"
git init

# 3. Conectar remoto
git remote add origin https://github.com/Nicmay18/informate-nicaragua.git

# 4. Traer todo del remoto
git fetch origin main

# 5. Forzar checkout al remoto (descarga archivos de GitHub)
git checkout -f -B main origin/main

# 6. Copiar los archivos modificados del temp
cp "$temp\index.html" "public\index.html" -Force
cp "$temp\noticia.html" "public\noticia.html" -Force
cp "$temp\404.html" "public\404.html" -Force
cp "$temp\contacto.html" "public\contacto.html" -Force
cp "$temp\manifest.json" "public\manifest.json" -Force
cp "$temp\rss.xml" "public\rss.xml" -Force
cp "$temp\firebase.json" "firebase.json" -Force
cp "$temp\firestore.rules" "firestore.rules" -Force

# 7. Commit y push
git add -A
git commit -m "fix: all critical bugs - modal removal, memory leaks, CLS, skeleton, firestore rules, 404, contact, rss"
git push origin main

Write-Host "=== DONE ===" -ForegroundColor Green
Write-Host "Verificá en: https://github.com/Nicmay18/informate-nicaragua/commits/main"
