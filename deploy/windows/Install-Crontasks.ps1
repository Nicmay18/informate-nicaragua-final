#Requires -Version 5.1
<#
.SYNOPSIS
  Equivalente Windows Task Scheduler de los crons de Vercel (vercel.json).
.DESCRIPTION
  Registra una tarea por cada endpoint /api/cron/* con la MISMA frecuencia
  UTC original. Nicaragua es UTC-6 fijo (sin DST): el script convierte
  automáticamente las horas UTC a hora local.

  Autenticación: Authorization: Bearer $CRON_SECRET (leído de .env.local
  del directorio de producción — nunca se escribe en la tarea ni en logs).

  Costo/seguridad:
   - Las 4 tareas ACTIVAS replican exactamente lo que Vercel ejecutaba.
   - Las 9 tareas PAUSADAS por cost_guard=economy se registran DESHABILITADAS
     (existen para auditoría; NO se ejecutan hasta que se autorice
     reactivarlas en Firestore config/cost_guard y se habiliten aquí).
  Idempotencia: cada tarea usa -StartWhenAvailable y "no iniciar nueva
  instancia si ya corre" — sin solapamientos.

.PARAMETER ProdDir   Directorio de producción (contiene .env.local).
.PARAMETER BaseUrl   URL base del servidor (default http://127.0.0.1:3000).
.PARAMETER WhatIfOnly  Solo muestra el plan sin registrar nada.
#>
param(
  [string]$ProdDir = "$env:USERPROFILE\informate-prod",
  [string]$BaseUrl = 'http://127.0.0.1:3000',
  [switch]$WhatIfOnly
)

$ErrorActionPreference = 'Stop'
$TaskPrefix = 'InformateCron'
$TZ = 'SA Pacific Standard Time'   # Nicaragua UTC-6 — verifica: tzutil /l | findstr "Pacific" si dudas

# ---------- Inventario: copiado de vercel.json (master post-#54) ----------
# utc = expresión cron original | active = no está en cost_guard.disabledCrons/disabledStages
$Crons = @(
  @{ Path='/api/cron/nios-collect?stage=collect';  Utc='0 8 * * *';  Active=$false; Note='etapa NIOS collect — pausada por cost_guard (disabledStages)' },
  @{ Path='/api/cron/nios-collect?stage=analyze';  Utc='30 8 * * *';Active=$false; Note='etapa NIOS analyze — pausada por cost_guard' },
  @{ Path='/api/cron/nios-collect?stage=ceo';      Utc='0 9 * * *';  Active=$false; Note='etapa NIOS ceo — pausada por cost_guard' },
  @{ Path='/api/cron/nios-collect?stage=finalize'; Utc='30 9 * * *';Active=$false; Note='etapa NIOS finalize — pausada por cost_guard' },
  @{ Path='/api/cron/resumen-diario';              Utc='0 12 * * *'; Active=$true;  Note='resumen diario Telegram (claim atómico anti-duplicado)' },
  @{ Path='/api/cron/departamento-central';        Utc='0 0 * * *';  Active=$false; Note='pausada por cost_guard (disabledCrons)' },
  @{ Path='/api/cron/departamento-daily';          Utc='0 6 * * *';  Active=$false; Note='pausada por cost_guard (disabledCrons)' },
  @{ Path='/api/cron/departamento-watchdog';       Utc='0 1 * * *';  Active=$true;  Note='watchdog departamentos' },
  @{ Path='/api/cron/nios-ceo-loop';               Utc='0 2 * * *';  Active=$false; Note='pausada por cost_guard (disabledCrons)' },
  @{ Path='/api/cron/supervisor-watch';            Utc='0 4 * * *';  Active=$false; Note='pausada por cost_guard (disabledCrons)' },
  @{ Path='/api/cron/traffic-cleanup';             Utc='0 3 * * *';  Active=$true;  Note='limpieza + snapshot cost_daily (idempotente por fecha)' },
  @{ Path='/api/cron/distribuciones-retry';        Utc='15 5 * * *'; Active=$true;  Note='reintenta distribuciones fallidas (estados terminales, sin duplicar)' },
  @{ Path='/api/cron/meni-learning-cycle';         Utc='0 6 * * 0';  Active=$false; Note='pausada por cost_guard (disabledCrons); domingos' }
)

# ---------- Cargar CRON_SECRET ----------
$envFile = Join-Path $ProdDir '.env.local'
if (-not (Test-Path $envFile)) { $envFile = Join-Path $PSScriptRoot '..\..\.env.local' }
$cronSecret = $null
if (Test-Path $envFile) {
  foreach ($line in Get-Content $envFile) {
    if ($line -match '^\s*CRON_SECRET\s*=\s*(.+?)\s*$') { $cronSecret = $Matches[1].Trim('"').Trim("'"); break }
  }
}
if (-not $cronSecret) { Write-Error "CRON_SECRET no encontrado en .env.local ($envFile)."; exit 1 }

# ---------- Helpers ----------
function Convert-UtcToLocal([string]$utcExpr) {
  # Soporta 'M H * * D' (diaSemana opcional, UTC). Devuelve DateTime en hora
  # local de la máquina (los triggers de Task Scheduler usan la TZ local).
  # OJO: un cron dominical 06:00 UTC puede caer en sábado local (UTC-6).
  $parts = $utcExpr -split '\s+'
  if ($parts.Count -lt 5) { throw "cron no soportado: $utcExpr" }
  $minute = [int]$parts[0]; $hour = [int]$parts[1]
  $utcCandidate = [DateTime]::SpecifyKind(
    ([DateTime]::UtcNow.Date.AddHours($hour).AddMinutes($minute)), 'Utc')
  return [TimeZoneInfo]::ConvertTime($utcCandidate, [TimeZoneInfo]::Utc, [TimeZoneInfo]::Local)
}

$registered = 0; $disabled = 0
foreach ($c in $Crons) {
  $name = "$TaskPrefix-" + ($c.Path -replace '[/?=&]', '-' -replace '-{2,}','-').Trim('-')
  if ($name.Length -gt 60) { $name = $name.Substring(0,60) }
  $localTime = Convert-UtcToLocal $c.Utc
  $dowUtc = ($c.Utc -split '\s+')[4]
  $hhmm = $localTime.ToString('HH:mm')
  $localDow = $localTime.DayOfWeek.ToString()   # día local resultante (puede diferir del UTC)

  if ($WhatIfOnly) {
    $state = if ($c.Active) {'ACTIVA  '} else {'PAUSADA '}
    $freq = if ($dowUtc -eq '*') {'diario'} else {"semanal($dowUtc UTC→$localDow local)"}
    Write-Host ("{0} {1,-38} {2,-8} {3,-6} local {4} [{5}]" -f $state, $c.Path, $c.Utc, $hhmm, $freq, $c.Note)
    continue
  }

  # Acción: curl.exe con header (no persiste el secreto en la línea de comandos
  # visible? SÍ la persiste en la tarea — mitigación: usamos script intermedio)
  # Mejor: tarea llama a Invoke-Cron.ps1 que lee el secreto en runtime.
  $helper = Join-Path $PSScriptRoot 'Invoke-Cron.ps1'
  $action = New-ScheduledTaskAction -Execute 'powershell.exe' `
    -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$helper`" -Url `"$($BaseUrl)$($c.Path)`" -ProdDir `"$ProdDir`""
  $trigger = if ($dowUtc -eq '*') {
    New-ScheduledTaskTrigger -Daily -At $localTime
  } else {
    # Semanal: el disparo debe caer en el día LOCAL equivalente (UTC-6 puede cruzar de día)
    $dowEnum = [System.DayOfWeek]::Parse($localDow)
    New-ScheduledTaskTrigger -Weekly -DaysOfWeek $dowEnum -At $localTime
  }
  $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
    -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Minutes 30) `
    -MultipleInstances IgnoreNew
  $principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType S4U -RunLevel Limited

  $task = Register-ScheduledTask -TaskName $name -Action $action -Trigger $trigger `
    -Settings $settings -Principal $principal -Force
  if (-not $c.Active) {
    Disable-ScheduledTask -TaskName $name | Out-Null
    $disabled++
  } else { $registered++ }
  Write-Host ("{0} {1} -> {2} ({3} local)" -f $(if($c.Active){'[ON] '}else{'[OFF]'}), $c.Path, $hhmm, $TZ)
}

Write-Host ""
Write-Host "Registradas: $registered activas | $disabled deshabilitadas (cost_guard)."
Write-Host "Ver plan sin ejecutar: .\Install-Crontasks.ps1 -WhatIfOnly"
