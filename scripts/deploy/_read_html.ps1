$file = 'e:\PROYECTO\informate-nicaragua-final\nicaragua_informate_index_v2.html'
$lines = Get-Content $file
Write-Output ('=== TOTAL LINES: ' + $lines.Count)
Write-Output '=== LINES 1-60 (HEAD + CSS vars) ==='
for ($i = 0; $i -lt 60; $i++) {
    Write-Output $lines[$i]
}
