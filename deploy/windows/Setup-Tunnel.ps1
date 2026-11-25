#Requires -Version 5.1
<#
.SYNOPSIS
  Instalación de Cloudflare Tunnel para Nicaragua Informate (Windows service).
.DESCRIPTION
  Instala cloudflared, crea el túnel persistente, escribe la config de
  ingress hacia localhost:3000 e instala el servicio de Windows (auto-start,
  auto-restart — gestionado por cloudflared, sin dependencia del vigía).

  PASOS QUE REQUIEREN TU CUENTA (👤) — este script NO los ejecuta solo:
   1. cloudflared login            → abre navegador, autorizas el dominio
   2. cloudflared tunnel create    → crea credenciales locales
   3. cloudflared tunnel route dns → DNS del hostname TEMPORAL de pruebas
   4. (más adelante, con tu OK)    → route dns del apex nicaraguainformate.com

  Ejecuta primero con -WhatIfOnly para ver el plan.
#>
param(
  [string]$ProdDir = "$env:USERPROFILE\informate-prod",
  [string]$TunnelName = 'informate-prod',
  [string]$TempHostname = '',           # ej: staging.nicaraguainformate.com — vacío = no crear ruta DNS
  [string]$LocalPort = '3000',
  [switch]$WhatIfOnly,
  [switch]$RouteDns                      # ejecuta 'tunnel route dns' solo si se pasa explícitamente
)

$ErrorActionPreference = 'Stop'
$CfgDir   = Join-Path $env:USERPROFILE '.cloudflared'
$CfgFile  = Join-Path $CfgDir 'config.yml'

function Info($m){ Write-Host "[INFO] $m" -ForegroundColor Cyan }
function Ok($m){   Write-Host "[OK]   $m" -ForegroundColor Green }
function Warn($m){ Write-Host "[WARN] $m" -ForegroundColor Yellow }
function Fail($m){ Write-Host "[FAIL] $m" -ForegroundColor Red; exit 1 }

# ---------- 1. cloudflared ----------
$cf = Get-Command cloudflared -ErrorAction SilentlyContinue
if (-not $cf) {
  Info "Instalando cloudflared..."
  if (Get-Command winget -ErrorAction SilentlyContinue) {
    winget install --id Cloudflare.cloudflared -e --accept-source-agreements --accept-package-agreements
  } else {
    $exe = Join-Path $env:USERPROFILE 'bin\cloudflared.exe'
    New-Item -ItemType Directory -Force -Path (Split-Path $exe) | Out-Null
    Invoke-WebRequest -Uri 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe' -OutFile $exe
    $env:Path += ";$(Split-Path $exe)"
  }
  $cf = Get-Command cloudflared -ErrorAction SilentlyContinue
  if (-not $cf) { Fail "cloudflared no quedó disponible en PATH. Reabre la terminal e intenta de nuevo." }
}
Ok "cloudflared: $(cloudflared --version 2>&1 | Select-Object -First 1)"

# ---------- 2. Login (👤 interactivo) ----------
New-Item -ItemType Directory -Force -Path $CfgDir | Out-Null
$cert = Join-Path $CfgDir 'cert.pem'
if (-not (Test-Path $cert)) {
  Warn "FALTA login de Cloudflare. Ejecuta AHORA en tu navegador:"
  Write-Host "  cloudflared login"
  Write-Host "  (elige el dominio nicaraguainformate.com y autoriza)"
  if ($WhatIfOnly) { Info "-WhatIfOnly: no se ejecuta login."; return }
  cloudflared login
  if (-not (Test-Path $cert)) { Fail "Login no completado (cert.pem ausente)." }
  Ok "Login completado"
} else { Ok "cert.pem ya existe (sesión previa)" }

# ---------- 3. Crear túnel ----------
$tunnelsJson = cloudflared tunnel list 2>$null | Out-String
$tunnelId = $null
if ($tunnelsJson -match [regex]::Escape($TunnelName)) {
  # extraer ID de la línea del túnel
  $line = ($tunnelsJson -split "`n" | Where-Object { $_ -match [regex]::Escape($TunnelName) } | Select-Object -First 1)
  if ($line -match '^([0-9a-f\-]{36})') { $tunnelId = $Matches[1] }
}
if (-not $tunnelId) {
  Info "Creando túnel '$TunnelName'..."
  if ($WhatIfOnly) { Info "-WhatIfOnly: se crearía el túnel aquí."; return }
  $createOut = cloudflared tunnel create $TunnelName 2>&1 | Out-String
  Write-Host $createOut
  if ($createOut -match '([0-9a-f\-]{36})\.json') {
    $tunnelId = $Matches[1]
  } else {
    $jsonPath = Join-Path $CfgDir "$TunnelName.json"
    if (Test-Path $jsonPath) {
      $tunnelId = (Get-Content $jsonPath -Raw | ConvertFrom-Json).TunnelID
    }
  }
  if (-not $tunnelId) { Fail "No se pudo determinar el Tunnel ID. Revisa la salida de 'cloudflared tunnel create'." }
}
$credFile = Join-Path $CfgDir "$TunnelName.json"
Ok "Túnel '$TunnelName' ID=$tunnelId cred=$credFile"

# ---------- 4. config.yml ----------
$expected = @"
tunnel: $tunnelId
credentials-file: $credFile

ingress:
  - hostname: ${TempHostname}
    service: http://127.0.0.1:$LocalPort
  - service: http_status:404
"@
if ($TempHostname) {
  Set-Content -Path $CfgFile -Value $expected -Encoding ascii
  Ok "config.yml escrito -> $CfgFile"
} else {
  # sin hostname temporal: solo localhost (pruebas internas)
  $fallback = @"
tunnel: $tunnelId
credentials-file: $credFile

ingress:
  - service: http://127.0.0.1:$LocalPort
  - service: http_status:404
"@
  Set-Content -Path $CfgFile -Value $fallback -Encoding ascii
  Warn "Sin TempHostname: ingress solo localhost. Pasa -TempHostname para exponer pruebas."
}

# ---------- 5. Instalar servicio ----------
Info " Instalando cloudflared como servicio de Windows..."
if ($WhatIfOnly) { Info "-WhatIfOnly: se ejecutaría 'cloudflared service install'."; return }
cloudflared service install
if ($LASTEXITCODE -ne 0) { Fail "cloudflared service install falló — ¿PowerShell como Administrador?" }
Ok "Servicio cloudflared instalado (auto-start + auto-restart)"
Start-Service cloudflared -ErrorAction SilentlyContinue

# ---------- 6. Ruta DNS del hostname TEMPORAL (👤 decisión) ----------
if ($TempHostname) {
  Info "Creando ruta DNS temporal: $TempHostname -> túnel"
  if ($WhatIfOnly) { Info "-WhatIfOnly: se ejecutaría 'cloudflared tunnel route dns $TunnelName $TempHostname'."; return }
  if ($RouteDns) {
    cloudflared tunnel route dns $TunnelName $TempHostname
    Ok "DNS temporal creado: https://$TempHostname"
  } else {
    Warn "DNS NO creado (falta -RouteDns). Cuando autorices, ejecuta:"
    Write-Host "  cloudflared tunnel route dns $TunnelName $TempHostname"
  }
}

Write-Host ""
Ok "TÚNEL LISTO"
Write-Host "  Servicio : cloudflared (Windows Services)"
Write-Host "  Config   : $CfgFile"
Write-Host "  Estado   : Get-Service cloudflared"
Write-Host "  Logs     : %USERPROFILE%\.cloudflared\*.log  (o visor de eventos)"
Write-Host ""
Write-Host "IMPORTANTE: el apex nicaraguainformate.com SIGUE apuntando a Vercel."
Write-Host "El cambio de DNS productivo es un paso SEPARADO que requiere tu OK"
Write-Host "(ver docs/SELFHOST_RECOVERY.md y la matriz de pruebas)."
