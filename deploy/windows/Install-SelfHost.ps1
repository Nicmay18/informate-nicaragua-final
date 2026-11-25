#Requires -Version 5.1
<#
.SYNOPSIS
  Instalador de Nicaragua Informate en modo self-hosting (Windows, $0).
.DESCRIPTION
  Prepara el directorio de producción, instala dependencias, compila el
  build standalone de Next.js, copia los secretos (.env.local) y registra
  el vigía como tarea programada de inicio automático.
  NO cambia DNS, NO despliega, NO toca Vercel/Firebase. Reversible con
  Uninstall-SelfHost.ps1.
.PARAMETER SourceDir  Repo clonado (contiene package.json, .env.local).
.PARAMETER ProdDir    Directorio de producción (default ~\informate-prod).
.PARAMETER SkipBuild  Solo copiar runtime existente (actualización rápida).
.EXAMPLE
  powershell -ExecutionPolicy Bypass -File .\Install-SelfHost.ps1 -SourceDir "E:\PROYECTO\informate-nicaragua-final"
#>
param(
  [Parameter(Mandatory=$true)][string]$SourceDir,
  [string]$ProdDir = "$env:USERPROFILE\informate-prod",
  [switch]$SkipBuild
)

$ErrorActionPreference = 'Stop'
$RuntimeDir = Join-Path $ProdDir 'runtime'
$LogDir     = Join-Path $ProdDir 'logs'
$TaskName   = 'InformateServer'

function Info($m){ Write-Host "[INFO] $m" -ForegroundColor Cyan }
function Ok($m){   Write-Host "[OK]   $m" -ForegroundColor Green }
function Warn($m){ Write-Host "[WARN] $m" -ForegroundColor Yellow }
function Fail($m){ Write-Host "[FAIL] $m" -ForegroundColor Red; exit 1 }

# ---------- 1. Verificaciones previas ----------
Info "Verificando prerrequisitos..."

if (-not (Test-Path (Join-Path $SourceDir 'package.json'))) { Fail "No se encontró package.json en $SourceDir" }

$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) { Fail "Node.js no está instalado. Instala Node 22 LTS (https://nodejs.org) y vuelve a ejecutar." }
$nodeVer = [version]((& node --version) -replace '^v','')
if ($nodeVer -lt [version]'20.0.0') { Fail "Node $nodeVer insuficiente — se requiere >=20 (recomendado 22.x)." }
if ($nodeVer.Major -ne 22) { Warn "Node $nodeVer detectado; el proyecto declara engines node 22.x. Funciona, pero 22 LTS es lo probado." }
Ok "Node $nodeVer"

if (-not (Test-Path (Join-Path $SourceDir '.env.local'))) {
  Warn ".env.local NO existe en $SourceDir — el servidor arrancará sin secretos (Firebase/Auth fallarán). Copia tus variables antes de continuar."
} else { Ok ".env.local presente" }

# ---------- 1b. Validar secretos críticos no vacíos ----------
Info "Validando variables críticas en .env.local..."
$envLocal = Join-Path $SourceDir '.env.local'
$requiredVars = @('CRON_SECRET','ADMIN_API_KEY','TG_TOKEN')
$emptyVars = @()
if (Test-Path $envLocal) {
  $envContent = Get-Content $envLocal -Raw
  foreach ($v in $requiredVars) {
    if ($envContent -notmatch "(?m)^\s*$v\s*=\s*['\`"]?[^\s'\`"]+" ) { $emptyVars += $v }
  }
  # Firebase: al menos una de las variantes de credenciales admin
  if ($envContent -notmatch '(?m)^\s*(FIREBASE_ADMIN.*|GOOGLE_APPLICATION_CREDENTIALS|GCLOUD_PROJECT)\s*=\s*[^\s]+') {
    $emptyVars += 'FIREBASE_ADMIN/GOOGLE_APPLICATION_CREDENTIALS'
  }
}
if ($emptyVars.Count -gt 0) {
  Warn "Variables VACÍAS o ausentes: $($emptyVars -join ', ')"
  Warn "CRON_SECRET vacío = los crons y varios endpoints admin NO funcionarán."
  Warn "En Vercel estos secretos viven en Project Settings → Environment Variables."
  Warn "Copia sus valores reales a .env.local ANTES de pasar a producción self-hosted."
} else { Ok "Secretos críticos presentes" }

# ---------- 2. Directorios ----------
Info "Preparando $ProdDir ..."
New-Item -ItemType Directory -Force -Path $RuntimeDir, $LogDir | Out-Null
Ok "Directorios: $RuntimeDir , $LogDir"

# ---------- 3. Build standalone ----------
if (-not $SkipBuild) {
  Info "Instalando dependencias (npm ci)..."
  Push-Location $SourceDir
  try {
    npm ci
    if ($LASTEXITCODE -ne 0) { Fail "npm ci falló" }
    Ok "Dependencias instaladas"

    Info "Compilando Next.js standalone (npm run build)..."
    npm run build
    if ($LASTEXITCODE -ne 0) { Fail "npm run build falló" }
    Ok "Build completado"
  } finally { Pop-Location }

  $standalone = Join-Path $SourceDir '.next\standalone'
  if (-not (Test-Path (Join-Path $standalone 'server.js'))) { Fail "No se generó .next/standalone/server.js" }

  # 4. Ensamblar runtime: standalone + assets estáticos + public + env
  Info "Ensamblando runtime portable..."
  if (Test-Path $RuntimeDir) { Remove-Item $RuntimeDir -Recurse -Force }
  New-Item -ItemType Directory -Force -Path $RuntimeDir | Out-Null
  Copy-Item (Join-Path $standalone '*') $RuntimeDir -Recurse -Force
  if (Test-Path (Join-Path $SourceDir '.next\static')) {
    New-Item -ItemType Directory -Force -Path (Join-Path $RuntimeDir '.next') | Out-Null
    Copy-Item (Join-Path $SourceDir '.next\static') (Join-Path $RuntimeDir '.next\static') -Recurse -Force
  }
  if (Test-Path (Join-Path $SourceDir 'public')) {
    Copy-Item (Join-Path $SourceDir 'public') (Join-Path $RuntimeDir 'public') -Recurse -Force
  }
  # Secretos: NUNCA en el repo ni en logs — solo archivo local del prod dir
  Copy-Item (Join-Path $SourceDir '.env.local') (Join-Path $ProdDir '.env.local') -Force
  Ok "Runtime ensamblado + .env.local copiado a $ProdDir"
} else {
  if (-not (Test-Path (Join-Path $RuntimeDir 'server.js'))) { Fail "-SkipBuild requiere runtime previo en $RuntimeDir" }
  Ok "Build omitido (-SkipBuild)"
}

# El vigía carga .env.local: Next standalone lee .env* del cwd → lo ponemos en runtime
if (Test-Path (Join-Path $ProdDir '.env.local')) {
  Copy-Item (Join-Path $ProdDir '.env.local') (Join-Path $RuntimeDir '.env.local') -Force
}

# ---------- 5. Vigía como tarea programada (inicio automático + reinicio) ----------
Info "Registrando tarea programada '$TaskName'..."
$watchdog = Join-Path $PSScriptRoot 'Start-Informate.ps1'
$action  = New-ScheduledTaskAction -Execute 'powershell.exe' `
  -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$watchdog`" -ProdDir `"$ProdDir`" -RuntimeDir `"$RuntimeDir`" -LogDir `"$LogDir`" -Port 3000"
$trigger = New-ScheduledTaskTrigger -AtStartup
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
  -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) `
  -ExecutionTimeLimit ([TimeSpan]::Zero) -StartWhenAvailable
$principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType S4U -RunLevel Limited
try {
  Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings `
    -Principal $principal -Force | Out-Null
  Ok "Tarea '$TaskName' registrada (arranque de Windows, reinicio automático)."
} catch {
  Warn "No se pudo registrar la tarea como S4U. Ejecuta este script como Administrador o usa -LogonType Interactive."
  $principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive -RunLevel Limited
  Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings `
    -Principal $principal -Force | Out-Null
  Ok "Tarea '$TaskName' registrada (inicio de sesión de Windows)."
}

# ---------- 6. Evitar suspensión (requiere admin; opcional) ----------
try {
  powercfg /change standby-timeout-ac 0 | Out-Null
  powercfg /change hibernate-timeout-ac 0 | Out-Null
  Ok "Suspensión en AC desactivada."
} catch { Warn "No se pudo ajustar powercfg (ejecuta como Administrador si quieres desactivar la suspensión)." }

# ---------- 7. Resumen ----------
Write-Host ""
Ok "INSTALACIÓN COMPLETA"
Write-Host "  Runtime : $RuntimeDir\server.js"
Write-Host "  Logs    : $LogDir\"
Write-Host "  Puerto  : 3000 (solo localhost — expuesto vía Cloudflare Tunnel)"
Write-Host ""
Write-Host "Siguiente paso: probar localmente ->"
Write-Host "  Start-ScheduledTask -TaskName $TaskName"
Write-Host "  curl http://localhost:3000/api/admin/estado"
Write-Host ""
Write-Host "Luego: .\Setup-Tunnel.ps1 (crea el túnel Cloudflare — requiere tu cuenta)"
