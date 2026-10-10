# Protección de `master` — configuración requerida

**Estado auditado (2026-10-10):** la API de protección de rama devuelve `401`
sin credenciales admin — no se pudo leer la configuración actual. Los últimos
commits (`fbe92034`, `71d650e5`, `f496c81b`…) fueron **pushes directos a
`master`**, lo que demuestra que hoy la rama acepta pushes sin PR ni revisión.

**Acción pendiente de administrador** — aplicar esta configuración en
GitHub → Settings → Branches → Add rule para `master`:

```json
{
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false,
    "require_last_push_approval": true
  },
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "Lint & TypeScript",
      "Unit & Integration Tests",
      "Build Next.js",
      "CI Summary"
    ]
  },
  "enforce_admins": true,
  "required_conversation_resolution": true,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "block_creations": false,
  "required_linear_history": false,
  "allow_auto_merge": false
}
```

Equivalente vía GitHub CLI:

```bash
gh api repos/Nicmay18/informate-nicaragua-final/branches/master/protection \
  -X PUT -F 'required_pull_request_reviews[required_approving_review_count]=1' \
  -F 'required_pull_request_reviews[dismiss_stale_reviews]=true' \
  -F 'required_pull_request_reviews[require_last_push_approval]=true' \
  -F 'required_conversation_resolution=true' \
  -F 'enforce_admins=true' -F 'allow_force_pushes=false' \
  -F 'allow_deletions=false' \
  -F 'required_status_checks[strict]=true' \
  -F 'required_status_checks[contexts][]=Lint & TypeScript' \
  -F 'required_status_checks[contexts][]=Unit & Integration Tests' \
  -F 'required_status_checks[contexts][]=Build Next.js' \
  -F 'required_status_checks[contexts][]=CI Summary'
```

## Restricción de bots

- `enforce_admins: true` impide que cualquier cuenta (incluida la del token de
  deploy) eluda la protección.
- En GitHub → Settings → Actions → General: PR approvals de Actions desactivados
  ("Allow GitHub Actions to create and approve pull requests" OFF).
- El bot de integración (Devin/Copilot) puede abrir PRs, pero nunca aprobarlos
  ni fusionarlos: ningún `auto-merge`.

## Bloqueo conocido

El job **Unit & Integration Tests** falla hoy por **26 tests preexistentes**
(suites swiss-watch, nios-intelligence, mission7/10, homepage-freshness,
nios-command-center, meni-premerge-review). Si se exige este check hoy,
**ningún PR puede fusionarse** hasta resolver la línea base
(`docs/testing-baseline.md`). Decisión del administrador:

- Opción A (recomendada): requerir `Lint & TypeScript`, `Build Next.js` y
  `CI Summary` ahora; activar el check de tests cuando la línea base esté en 0.
- Opción B: permitir el check de tests solo informativo (`continue-on-error`)
  temporalmente — **no recomendado**: normaliza el rojo.
