#Requires -Version 5.1
<#
.SYNOPSIS
  Desinstalación / rollback local del self-hosting.
.DESCRIPTION
  Detiene el servidor y las tareas programadas. NO toca DNS ni Vercel —
  el rollback de DNS es un paso separado (ver docs/SELFHOST_RECOVERY.md).
  Los datos de Firebase NO se tocan.
#>
param(
  [string]$ProdDir = "$env:USERPROFILE\informate-prod",
  [switch]$RemoveFiles   # borra runtime/logs (¡destructivo! solo si se pide)
)

$ErrorActionPreference = 'Continue'

Write-Host "Deteniendo servidor en :3000..." -ForegroundColor Cyan
Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue |
  ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }

Write-Host "Eliminando tareas programadas..." -ForegroundColor Cyan
Get-ScheduledTask -ErrorAction SilentlyContinue |
  Where-Object { $_.TaskName -like 'InformateServer' -or $_.TaskName -like 'InformateCron-*' } |
  ForEach-Object { Unregister-ScheduledTask -TaskName $_.TaskName -Confirm:$false; Write-Host "  - $($_.TaskName)" }

# Servicio cloudflared (opcional — comentar la línea si se quiere conservar el túnel)
if (Get-Service cloudflared -ErrorAction SilentlyContinue) {
  Write-Host "Deteniendo servicio cloudflared..." -ForegroundColor Cyan
  Stop-Service cloudflared -Force -ErrorAction SilentlyContinue
  # cloudflared service uninstall requiere el binario; descomenta si aplica:
  # & "$env:ProgramFiles (x86)\cloudflared\cloudflared.exe" service uninstall
}

if ($RemoveFiles -and (Test-Path $ProdDir)) {
  Write-Warning "Borrando $ProdDir (runtime + logs + .env.local local)..."
  Remove-Item $ProdDir -Recurse -Force
}
Write-Host "Listo. El sitio vuelve a depender de Vercel cuando DNS lo apunte allí." -ForegroundColor Green
