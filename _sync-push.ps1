$ErrorActionPreference = "Stop"
$repo = "G:\RESPALDO\ESCRITORIO\informate-nicaragua-final"
$remote = "https://github.com/Nicmay18/informate-nicaragua-final.git"
$branch = "master"
$msg = "feat: home header cleanup, social grid, footer legal, article wide layout with sidebar, radios, hero arrows"

$log = "$repo\_sync-push.log"
if (Test-Path $log) { Remove-Item $log -Force }

function Run($cmd) {
  Write-Host ">> $cmd"
  Add-Content $log ">> $cmd"
  $out = cmd /c "$cmd 2>&1"
  $out | ForEach-Object { Write-Host $_; Add-Content $log $_ }
  if ($LASTEXITCODE -ne 0) { throw "FAILED: $cmd" }
}

Set-Location $repo

Write-Host "=== 1. Backup and reset broken .git ===" -ForegroundColor Cyan
if (Test-Path ".git") {
  $bk = ".git_broken_" + (Get-Date -Format "yyyyMMdd_HHmmss")
  Rename-Item ".git" $bk
  Write-Host "Old .git moved to $bk"
}

Write-Host "=== 2. git init ===" -ForegroundColor Cyan
Run "git init -b $branch"
Run "git remote add origin $remote"

Write-Host "=== 3. Fetch remote $branch ===" -ForegroundColor Cyan
Run "git fetch origin $branch --depth=1"

Write-Host "=== 4. Reset index to remote (keep working tree) ===" -ForegroundColor Cyan
Run "git reset --mixed FETCH_HEAD"

Write-Host "=== 5. Stage changed files ===" -ForegroundColor Cyan
Run "git add -A"

Write-Host "=== 6. Show diff summary ===" -ForegroundColor Cyan
Run "git diff --cached --stat"

Write-Host "=== 7. Commit ===" -ForegroundColor Cyan
Run "git -c user.email=cascade@local -c user.name=Cascade commit -m `"$msg`""

Write-Host "=== 8. Push ===" -ForegroundColor Cyan
Run "git push origin HEAD:$branch"

Write-Host "=== DONE ===" -ForegroundColor Green
Write-Host "Revisa: https://github.com/Nicmay18/informate-nicaragua-final/commits/$branch"
