#Requires -Version 5.1
<#
.SYNOPSIS
  Invocador de un endpoint /api/cron/* — helper de Task Scheduler.
.DESCRIPTION
  Lee CRON_SECRET de .env.local EN TIEMPO DE EJECUCIÓN (no queda en la
  definición de la tarea) y hace GET con Authorization: Bearer.
  Loguea solo status + duración, NUNCA el secreto ni la respuesta completa.
#>
param(
  [Parameter(Mandatory=$true)][string]$Url,
  [Parameter(Mandatory=$true)][string]$ProdDir,
  [int]$TimeoutSec = 600
)

$ErrorActionPreference = 'Continue'
$logDir = Join-Path $ProdDir 'logs'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$logFile = Join-Path $logDir 'crons.log'

function Log($m){ Add-Content -Path $logFile -Value ("{0} {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $m) }

# Leer secreto del .env.local del prod dir (o del runtime si existe ahí)
$secret = $null
foreach ($candidate in @((Join-Path $ProdDir '.env.local'), (Join-Path $ProdDir 'runtime\.env.local'))) {
  if (Test-Path $candidate) {
    foreach ($line in Get-Content $candidate) {
      if ($line -match '^\s*CRON_SECRET\s*=\s*(.+?)\s*$') { $secret = $Matches[1].Trim('"').Trim("'"); break }
    }
    if ($secret) { break }
  }
}
if (-not $secret) { Log "ERROR $Url — CRON_SECRET no encontrado"; exit 2 }

$sw = [Diagnostics.Stopwatch]::StartNew()
try {
  $r = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec $TimeoutSec `
       -Headers @{ 'Authorization' = "Bearer $secret" } -Method Get
  $sw.Stop()
  # Resumen seguro: status + tamaño; nunca loguear body completo (puede contener datos)
  $body = $r.Content
  $skipped = if ($body -match '"skipped"') {' skipped'} else {''}
  Log ("OK   {0} -> {1} ({2} bytes, {3:N0} ms{4})" -f $Url, $r.StatusCode, $body.Length, $sw.ElapsedMilliseconds, $skipped)
} catch {
  $sw.Stop()
  $code = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { 'ERR' }
  Log ("FAIL {0} -> {1} ({2:N0} ms): {3}" -f $Url, $code, $sw.ElapsedMilliseconds, $_.Exception.Message)
  exit 1
}
