# Release — plantilla de trazabilidad

Completar una sección por release real (tag). Copiar este bloque al crear
`vX.Y.Z` y adjuntarlo a la release de GitHub.

```markdown
## Release vX.Y.Z — YYYY-MM-DD

- Commit SHA (código):
- Rama y PR asociado:
- CI: [ ] Lint & TypeScript [ ] Tests [ ] Build [ ] CI Summary — enlace al run:
- Deployment ID / URL:
- SHA efectivamente desplegado (debe coincidir con el commit o explicarse):
- Alias de producción / entorno:
- Smoke tests post-deploy: rutas verificadas + códigos HTTP:
- Cambios de configuración (env vars, CSP, reglas):
- Migraciones de datos (si aplica):
- Riesgos conocidos:
- Plan de rollback: (revert del SHA / redeploy del deployment anterior)
- Aprobado por:
```

## Convención propuesta

- `PATCH` (x.y.Z): correcciones críticas y operativas (P0-x, fixes con causa
  raíz demostrada).
- `MINOR` (x.Y.z): mejoras funcionales aprobadas (incl. excepciones LTS).
- `MAJOR` (X.y.z): cambios de arquitectura o contratos.
- El tag se crea solo después del PR fusionado con CI verde y aprobación humana.
