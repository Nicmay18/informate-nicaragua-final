# NIOS CEO v2 — 24/7 verification script
# Run from repository root: .\scripts\nios-24-7-verify.ps1

$ErrorActionPreference = 'Stop'

function Step-Run($name, $cmd) {
  Write-Host "[NIOS VERIFY] $name ..." -ForegroundColor Cyan
  Invoke-Expression $cmd
  if ($LASTEXITCODE -ne 0) {
    throw "FAILED: $name (exit $LASTEXITCODE)"
  }
  Write-Host "[NIOS VERIFY] $name OK" -ForegroundColor Green
}

Step-Run 'type-check' 'npm run type-check'
Step-Run 'lint' 'npm run lint'
Step-Run 'build' 'npm run build'
Step-Run 'unit tests' 'npx vitest run'

Write-Host '[NIOS VERIFY] All 24/7 checks passed' -ForegroundColor Green
