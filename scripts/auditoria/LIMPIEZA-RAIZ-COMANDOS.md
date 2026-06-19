# LIMPIEZA DE RAIZ — COMANDOS PARA EJECUTAR MANUALMENTE

Copiá y pegá cada bloque en PowerShell (como administrador, en la raíz del proyecto).

---

## PASO 1: Crear carpetas destino

```powershell
New-Item -ItemType Directory -Force -Path scripts\backup, scripts\auditoria, scripts\migrations, scripts\deploy
```

---

## PASO 2: Mover BACKUPS (.json grandes, dumps, backups de Firestore)

```powershell
Move-Item backup-*.json scripts\backup\ -ErrorAction SilentlyContinue
Move-Item firestore-current-backup-*.json scripts\backup\ -ErrorAction SilentlyContinue
Move-Item firestore-summary-*.json scripts\backup\ -ErrorAction SilentlyContinue
Move-Item batch-data.json scripts\backup\ -ErrorAction SilentlyContinue
Move-Item clean-list.json scripts\backup\ -ErrorAction SilentlyContinue
Move-Item list_*.json scripts\backup\ -ErrorAction SilentlyContinue
Move-Item has-content.json scripts\backup\ -ErrorAction SilentlyContinue
Move-Item needs-content.json scripts\backup\ -ErrorAction SilentlyContinue
Move-Item all-articles-sample.json scripts\backup\ -ErrorAction SilentlyContinue
Move-Item afectadas.json scripts\backup\ -ErrorAction SilentlyContinue
Move-Item recuperables.json scripts\backup\ -ErrorAction SilentlyContinue
Move-Item perdidos*.json scripts\backup\ -ErrorAction SilentlyContinue
Move-Item diagnostico-*.json scripts\backup\ -ErrorAction SilentlyContinue
Move-Item log-*.json scripts\backup\ -ErrorAction SilentlyContinue
Move-Item clean-seo.js scripts\backup\ -ErrorAction SilentlyContinue
Move-Item correcciones-*.json scripts\backup\ -ErrorAction SilentlyContinue
Move-Item oro-*.json scripts\backup\ -ErrorAction SilentlyContinue
Move-Item bronce-*.json scripts\backup\ -ErrorAction SilentlyContinue
Move-Item plata-*.json scripts\backup\ -ErrorAction SilentlyContinue
Move-Item bajo500.json scripts\backup\ -ErrorAction SilentlyContinue
```

---

## PASO 3: Mover REPORTES Y AUDITORÍAS (.txt, .md, .html, .csv, .out)

```powershell
Move-Item *.txt scripts\auditoria\ -ErrorAction SilentlyContinue
Move-Item *.md scripts\auditoria\ -ErrorAction SilentlyContinue
Move-Item *.html scripts\auditoria\ -ErrorAction SilentlyContinue
Move-Item *.csv scripts\auditoria\ -ErrorAction SilentlyContinue
Move-Item *.out scripts\auditoria\ -ErrorAction SilentlyContinue
Move-Item *.log scripts\auditoria\ -ErrorAction SilentlyContinue
```

**Excepciones (quedan en raíz):**
- `README.md`
- `INFORME_FORENSE.md`
- `GUIA-EDITORIAL.md`
- `PLAN-CRECIMIENTO.md`
- `AUDIT-CHANGES.md`
- `AUDITORIA-ESTADO-REAL.md`
- `CAMBIOS_v2_ANALISIS.md`
- `REDESIGN_README.md`
- `REVISION_PELIGRO.md`
- `PROMPT_MAESTRO_NICARAGUA_INFORMATE.md`

Si los moviste por error, traélos de vuelta:
```powershell
Move-Item scripts\auditoria\README.md .\ -ErrorAction SilentlyContinue
Move-Item scripts\auditoria\INFORME_FORENSE.md .\ -ErrorAction SilentlyContinue
Move-Item scripts\auditoria\GUIA-EDITORIAL.md .\ -ErrorAction SilentlyContinue
Move-Item scripts\auditoria\PLAN-CRECIMIENTO.md .\ -ErrorAction SilentlyContinue
Move-Item scripts\auditoria\AUDIT-CHANGES.md .\ -ErrorAction SilentlyContinue
Move-Item scripts\auditoria\AUDITORIA-ESTADO-REAL.md .\ -ErrorAction SilentlyContinue
Move-Item scripts\auditoria\CAMBIOS_v2_ANALISIS.md .\ -ErrorAction SilentlyContinue
Move-Item scripts\auditoria\REDESIGN_README.md .\ -ErrorAction SilentlyContinue
Move-Item scripts\auditoria\REVISION_PELIGRO.md .\ -ErrorAction SilentlyContinue
Move-Item scripts\auditoria\PROMPT_MAESTRO_NICARAGUA_INFORMATE.md .\ -ErrorAction SilentlyContinue
```

---

## PASO 4: Mover SCRIPTS DE AUDITORÍA (.mjs, .js sueltos)

```powershell
Move-Item auditar-*.mjs scripts\auditoria\ -ErrorAction SilentlyContinue
Move-Item analizar-*.mjs scripts\auditoria\ -ErrorAction SilentlyContinue
Move-Item verificar-*.mjs scripts\auditoria\ -ErrorAction SilentlyContinue
Move-Item diagnosticar-*.mjs scripts\auditoria\ -ErrorAction SilentlyContinue
Move-Item listar-*.mjs scripts\auditoria\ -ErrorAction SilentlyContinue
Move-Item revisar-*.mjs scripts\auditoria\ -ErrorAction SilentlyContinue
Move-Item check-*.mjs scripts\auditoria\ -ErrorAction SilentlyContinue
Move-Item debug-*.mjs scripts\auditoria\ -ErrorAction SilentlyContinue
Move-Item test-*.mjs scripts\auditoria\ -ErrorAction SilentlyContinue
Move-Item contar-*.mjs scripts\auditoria\ -ErrorAction SilentlyContinue
Move-Item spotcheck.mjs scripts\auditoria\ -ErrorAction SilentlyContinue
Move-Item detect_*.js scripts\auditoria\ -ErrorAction SilentlyContinue
Move-Item verify*.js scripts\auditoria\ -ErrorAction SilentlyContinue
Move-Item analyze_*.js scripts\auditoria\ -ErrorAction SilentlyContinue
Move-Item check_*.js scripts\auditoria\ -ErrorAction SilentlyContinue
Move-Item fix_*.js scripts\auditoria\ -ErrorAction SilentlyContinue
Move-Item export_*.js scripts\auditoria\ -ErrorAction SilentlyContinue
Move-Item dump_*.js scripts\auditoria\ -ErrorAction SilentlyContinue
Move-Item extract_*.js scripts\auditoria\ -ErrorAction SilentlyContinue
Move-Item verify_*.js scripts\auditoria\ -ErrorAction SilentlyContinue
Move-Item test-*.js scripts\auditoria\ -ErrorAction SilentlyContinue
Move-Item reporte-*.mjs scripts\auditoria\ -ErrorAction SilentlyContinue
Move-Item *.mjs scripts\auditoria\ -ErrorAction SilentlyContinue
Move-Item *.js scripts\auditoria\ -ErrorAction SilentlyContinue
```

**Excepciones (quedan en raíz):**
- `next.config.ts` (o .js)
- `tailwind.config.js`
- `postcss.config.mjs`
- `next-sitemap.config.js`
- `lighthouserc.js`
- `vitest.config.ts`
- `playwright.config.ts`
- `middleware.ts`
- `next-env.d.ts`
- `.eslintrc.json`

Si los moviste por error, traélos de vuelta:
```powershell
Move-Item scripts\auditoria\next.config.ts .\ -ErrorAction SilentlyContinue
Move-Item scripts\auditoria\next.config.js .\ -ErrorAction SilentlyContinue
Move-Item scripts\auditoria\tailwind.config.js .\ -ErrorAction SilentlyContinue
Move-Item scripts\auditoria\postcss.config.mjs .\ -ErrorAction SilentlyContinue
Move-Item scripts\auditoria\next-sitemap.config.js .\ -ErrorAction SilentlyContinue
Move-Item scripts\auditoria\lighthouserc.js .\ -ErrorAction SilentlyContinue
Move-Item scripts\auditoria\vitest.config.ts .\ -ErrorAction SilentlyContinue
Move-Item scripts\auditoria\playwright.config.ts .\ -ErrorAction SilentlyContinue
Move-Item scripts\auditoria\middleware.ts .\ -ErrorAction SilentlyContinue
Move-Item scripts\auditoria\next-env.d.ts .\ -ErrorAction SilentlyContinue
Move-Item scripts\auditoria\.eslintrc.json .\ -ErrorAction SilentlyContinue
```

---

## PASO 5: Mover SCRIPTS DE DEPLOY (.ps1, .sh, .bat)

```powershell
Move-Item *.ps1 scripts\deploy\ -ErrorAction SilentlyContinue
Move-Item *.sh scripts\deploy\ -ErrorAction SilentlyContinue
Move-Item *.bat scripts\deploy\ -ErrorAction SilentlyContinue
```

---

## PASO 6: Mover SCRIPTS DE MIGRACIÓN Y PYTHON

```powershell
Move-Item migrar-*.mjs scripts\migrations\ -ErrorAction SilentlyContinue
Move-Item insertar-*.mjs scripts\migrations\ -ErrorAction SilentlyContinue
Move-Item restaurar-*.mjs scripts\migrations\ -ErrorAction SilentlyContinue
Move-Item restore-*.js scripts\migrations\ -ErrorAction SilentlyContinue
Move-Item rebuild_*.js scripts\migrations\ -ErrorAction SilentlyContinue
Move-Item inyectar-*.mjs scripts\migrations\ -ErrorAction SilentlyContinue
Move-Item reinsertar-*.mjs scripts\migrations\ -ErrorAction SilentlyContinue
Move-Item *.py scripts\auditoria\ -ErrorAction SilentlyContinue
```

---

## PASO 7: Eliminar archivos vacíos e inútiles

```powershell
Remove-Item -Force status.txt, gitlog.txt, gitbranch.txt, diffstat.txt, "Nuevo Documento de texto.txt", csp.ps1, "4.7MB)'" -ErrorAction SilentlyContinue
```

---

## PASO 8: Verificar resultado

```powershell
Write-Host "=== ARCHIVOS EN RAIZ ===" -ForegroundColor Green
Get-ChildItem -Path . -File | Select-Object Name, @{N='SizeKB';E={[math]::Round($_.Length/1KB,2)}} | Format-Table -AutoSize

Write-Host "=== ARCHIVOS EN scripts/ ===" -ForegroundColor Green
Get-ChildItem -Path scripts -Recurse -File | Group-Object Directory | Select-Object Name, Count | Format-Table -AutoSize
```

**Objetivo:** Máximo 15-20 archivos en la raíz.

---

## ARCHIVOS QUE DEBEN QUEDAR EN RAIZ

```
.env.local
.env.local.example
.eslintrc.json
.firebaserc
.gitattributes
.gitignore
.middleware.ts
.npmrc
next-env.d.ts
next-sitemap.config.js
firebase.json
firestore.indexes.json
INFORME_FORENSE.md
lighthouserc.js
manifest.json
netlify.toml
package-lock.json
package.json
playwright.config.ts
postcss.config.mjs
README.md
tailwind.config.js
tsconfig.json
vercel.json
vitest.config.ts
```

Si falta alguno, traélo de vuelta desde `scripts\auditoria\` o `scripts\backup\`.
