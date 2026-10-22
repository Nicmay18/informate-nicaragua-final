# Evidencia de Negocios MVP

Base comprobada: `5fa19c68aa2b6c98d4539afe5851cd9f651b0aff`
(`origin/master`). `git merge-base HEAD origin/master` devuelve ese SHA;
la historia de esta rama no incorpora `feat/auspiciadores-directos` (PR #10).
PR de entrega: <https://github.com/Nicmay18/informate-nicaragua-final/pull/15>.

## Entorno y alcance

Node 22.21.0, Next.js 15.5.28 instalado localmente. Los tests de rutas y el
recorrido comercial usan el mismo doble de Firestore en memoria. No se
crearon negocios, campañas, pagos ni métricas sintéticas en producción.
No hubo despliegue a producción, modificación de credenciales o Rules.

El doble local comprueba las lecturas antes de escrituras y serializa las
transacciones. No reproduce índices, contención, reintentos o conectividad
de Firestore real. Por tanto, no equivale a una validación de infraestructura
desplegada. El preload se encuentra exclusivamente en `tests/fixtures` y
requiere habilitación explícita; la aplicación no lo importa.

## Resultados ejecutados

- Suite Vitest completa: **120 archivos, 1537 aprobadas, 2 omitidas**.
  El intento anterior tuvo un timeout en GSC y un mock de sitemap incorrecto.
  El mock se corrigió y GSC respondió en la ejecución completa posterior.
- Negocios (incluidas en esa suite): **57 pruebas aprobadas**.
- E2E general: **13 aprobadas, 17 fallidas, 5 omitidas**, cinco navegadores
  configurados, servidor local con base en memoria. No es una suite verde.
  Los 17 fallos corresponden a `tests/e2e/homepage.spec.ts`: diez por
  falta de artículos en la base de prueba, cinco por el selector antiguo del
  enlace de salto y dos porque la navegación permanece oculta en móvil.
  Las cinco omisiones son el recorrido comercial que requiere activar su
  fixture explícitamente; se ejecuta con la configuración dedicada.

El workflow existente tiene `continue-on-error: true` en el paso general
de Playwright. El estado verde del job no certifica sus pruebas. La
configuración dedicada usa cero reintentos y devuelve un código distinto
de cero cuando falla una prueba.

## Reproducción

Con Node 22 y dependencias instaladas:

```sh
npm run type-check
npm run lint
npx vitest run --maxWorkers=4
npx playwright install chromium
```

Para compilar y ejecutar el recorrido comercial con Firestore aislado,
en Bash/Git Bash, desde la raíz del repositorio:

```sh
NEGOCIOS_TEST_FIXTURE=1 \
NODE_OPTIONS="--max-old-space-size=4096 --require ./tests/fixtures/negocios-server.cjs" \
npx next build
npx playwright test -c playwright.negocios.config.ts
```

La configuración arranca su propio servidor en `localhost:3000` y rechaza
reutilizar uno existente. El preload vacía las variables de los archivos
`.env*` en el proceso de prueba, sin editar esos archivos, y sustituye
Firestore por memoria. Las navegaciones externas del recorrido se bloquean:
el clic WhatsApp no contacta a nadie.

El test comprueba: solicitud pendiente, revisión y aprobación desde el
panel, 404 antes de aprobar, rechazo de pago sin confirmación, campaña con
referencia sintética, búsqueda pública, enlace seguro, clic registrado,
CSV y sitemap. Usa una sesión administrativa local de prueba; no prueba el
login real de Firebase. Las pruebas de rutas comprueban además cada método
administrativo sin middleware, cookies y credenciales inválidas, credenciales
cron/cleanup, slugs duplicados, estados no publicables, URL maliciosa,
deduplicación, auditoría y límites de pilotos.

## Capturas de prueba local

Todos los nombres, importes y referencias de estas imágenes son sintéticos.
El importe US$10 del panel **no representa un pago ni ingreso real**.
Las capturas se entregan empaquetadas en
[evidencia/negocios-evidencia-local.zip](evidencia/negocios-evidencia-local.zip)
(el workflow de compresión de imágenes del repo reempaqueta cualquier PNG
del PR y corta los checks del último SHA; el zip evita ese ciclo):

- `directorio-local.png` — directorio con búsqueda
- `perfil-movil-local.png` — perfil aprobado en móvil, etiqueta PATROCINADO
- `panel-campanas-local.png` — campaña con referencia `SIMULADO-NO-ES-UN-PAGO`

## Pendiente para una puesta en producción

Revisión humana del PR, comprobación de CI para su último SHA y autorización
de despliegue. Tras un despliegue autorizado, verificar sesión real,
conectividad de Firestore y telemetría con un negocio autorizado. Contacto
con prospectos, permiso para publicar sus datos y verificación de pagos
corresponden al propietario. El playbook y las reglas de los tres pilotos
están en [la guía operativa](negocios-mvp.md).
