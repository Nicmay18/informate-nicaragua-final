#Requires -Version 5.1
<#
.SYNOPSIS
  Actualización segura del servidor self-hosted.
.DESCRIPTION
  git pull en el repo fuente → rebuild standalone → reensamblar runtime →
  reiniciar el vigía (el servidor vuelve en segundos). Conserva .env.local.
#>
param(
  [Parameter(Mandatory=$true)][string]$SourceDir,
  [string]$ProdDir = "$env:USERPROFILE\informate-prod"
)
$ErrorActionPreference = 'Stop'
$RuntimeDir = Join-Path $ProdDir 'runtime'
$TaskName   = 'InformateServer'

Write-Host "[1/4] git pull en $SourceDir ..." -ForegroundColor Cyan
Push-Location $SourceDir
git pull --ff-only
if ($LASTEXITCODE -ne 0) { Pop-Location; Write-Error "git pull falló (¿cambios locales sin commitear?)"; exit 1 }
Pop-Location

Write-Host "[2/4] Rebuild..." -ForegroundColor Cyan
Push-Location $SourceDir
npm ci; if ($LASTEXITCODE -ne 0) { Pop-Location; exit 1 }
npm run build; if ($LASTEXITCODE -ne 0) { Pop-Location; exit 1 }
Pop-Location

Write-Host "[3/4] Reensamblar runtime..." -ForegroundColor Cyan
$standalone = Join-Path $SourceDir '.next\standalone'
if (Test-Path $RuntimeDir) { Remove-Item $RuntimeDir -Recurse -Force }
New-Item -ItemType Directory -Force -Path $RuntimeDir | Out-Null
Copy-Item (Join-Path $standalone '*') $RuntimeDir -Recurse -Force
New-Item -ItemType Directory -Force -Path (Join-Path $RuntimeDir '.next') | Out-Null
Copy-Item (Join-Path $SourceDir '.next\static') (Join-Path $RuntimeDir '.next\static') -Recurse -Force
Copy-Item (Join-Path $SourceDir 'public') (Join-Path $RuntimeDir 'public') -Recurse -Force
# Restaurar secretos (nunca se versionan)
foreach ($env in @('.env.local')) {
  if (Test-Path (Join-Path $ProdDir $env)) { Copy-Item (Join-Path $ProdDir $env) (Join-Path $RuntimeDir $env) -Force }
}

Write-Host "[4/4] Reiniciando servidor..." -ForegroundColor Cyan
# Detener node en :3000 y el vigía; la tarea/Start-Process lo vuelve a levantar
Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue |
  ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
Start-Sleep -Seconds 3
if (Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue) {
  Start-ScheduledTask -TaskName $TaskName
} else {
  & (Join-Path $PSScriptRoot 'Start-Informate.ps1') -ProdDir $ProdDir
}
Start-Sleep -Seconds 15
try {
  $r = Invoke-WebRequest 'http://127.0.0.1:3000/api/admin/estado' -UseBasicParsing -TimeoutSec 10
  Write-Host "[OK] Servidor responde: $($r.StatusCode)" -ForegroundColor Green
} catch { Write-Warning "El servidor aún no responde — revisa $ProdDir\logs\" }
