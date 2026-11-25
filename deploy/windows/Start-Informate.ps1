#Requires -Version 5.1
<#
.SYNOPSIS
  Vigía del servidor Nicaragua Informate (Next.js standalone).
.DESCRIPTION
  Mantiene `node server.js` vivo: lo arranca si no corre, lo reinicia si
  cae, y rota los logs para no llenar el disco. Diseñado para ejecutarse
  como tarea programada de Windows (inicio del sistema / inicio de sesión)
  con "reiniciar en caso de error".
  NO contiene secretos: los lee del entorno / .env.local del directorio prod.
#>
param(
  [string]$ProdDir = "$env:USERPROFILE\informate-prod",
  [string]$RuntimeDir = "$env:USERPROFILE\informate-prod\runtime",
  [int]$Port = 3000,
  [string]$LogDir = "$env:USERPROFILE\informate-prod\logs",
  [int]$MaxLogMB = 50,
  [int]$KeepLogs = 7,
  [int]$RestartDelaySec = 5
)

$ErrorActionPreference = 'Continue'
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
$pidFile = Join-Path $RuntimeDir 'server.pid'

function Write-Log([string]$msg) {
  $line = "{0} {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $msg
  Add-Content -Path (Join-Path $LogDir 'watchdog.log') -Value $line
}

function Rotate-Logs {
  Get-ChildItem $LogDir -Filter 'server-*.log' -ErrorAction SilentlyContinue |
    Where-Object { $_.Length -gt ($MaxLogMB * 1MB) } |
    ForEach-Object {
      $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
      Move-Item $_.FullName (Join-Path $LogDir ("server-{0}-{1}.log" -f $stamp, $_.BaseName)) -Force
      Write-Log "Rotado log grande: $($_.Name)"
    }
  Get-ChildItem $LogDir -Filter 'server-*.log' -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending | Select-Object -Skip $KeepLogs |
    Remove-Item -Force -ErrorAction SilentlyContinue
}

function Test-ServerUp {
  try {
    $r = Invoke-WebRequest -Uri "http://127.0.0.1:$Port/api/admin/estado" -UseBasicParsing -TimeoutSec 8
    return ($r.StatusCode -eq 200)
  } catch {
    # 401/403 también prueban que el proceso responde; solo 'connection refused' es caída real
    if ($_.Exception.Response) { return $true }
    return $false
  }
}

function Start-Server {
  $env:PORT = "$Port"
  $env:HOSTNAME = '127.0.0.1'
  $env:NODE_ENV = 'production'
  $today = Get-Date -Format 'yyyyMMdd'
  $outLog = Join-Path $LogDir "server-$today.log"
  # node server.js escribe stdout+stderr; Start-Process no fusiona ambos → wrapper cmd
  $cmd = "node `"server.js`" >> `"$outLog`" 2>&1"
  $p = Start-Process -FilePath 'cmd.exe' -ArgumentList '/c', $cmd `
       -WorkingDirectory $RuntimeDir -WindowStyle Hidden -PassThru
  Set-Content -Path $pidFile -Value $p.Id
  Write-Log "Arrancado server.js (wrapper PID $($p.Id)) en puerto $Port"
}

Write-Log "Vigia iniciada (PID $PID). ProdDir=$ProdDir Runtime=$RuntimeDir"
while ($true) {
  try {
    if (-not (Test-ServerUp)) {
      Write-Log "Servidor no responde en :$Port — arrancando..."
      Start-Server
      Start-Sleep -Seconds 15
      if (Test-ServerUp) { Write-Log "Servidor OK tras arranque." }
      else { Write-Log "AVISO: servidor sigue sin responder tras arranque." }
    }
  } catch {
    Write-Log "ERROR en ciclo del vigía: $($_.Exception.Message)"
  }
  Rotate-Logs
  Start-Sleep -Seconds 30
}
