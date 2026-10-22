# Negocios — MVP comercial (guía de operación)

## Lo que el producto vende (y lo que no)

Un **perfil comercial revisado** en `/negocios` con contacto directo y medición
honesta. El reporte al anunciante muestra **clics registrados** (vista, WhatsApp,
llamada, web). Un clic **no es** una conversación, un cliente ni una venta: el
CSV lo dice explícitamente. Nunca prometer ingresos ni resultados al anunciante.

## Ciclo de vida

1. Alta: formulario público `/negocios/alta` (o creación en panel) → queda
   `pendiente` en `negocios_solicitudes`. Nada se publica solo.
2. Revisión: panel → Solicitudes → "Preparar perfil" → guardar (queda
   `pendiente`) → botón **Aprobar y publicar**.
3. Publicación: visible solo si `estado=aprobado` y `vigenteHasta` no expiró.
4. Campaña: panel → Campañas. `pagado` exige `pagoConfirmado` + `referenciaPago`
   + importe > 0, solo tras verificar el dinero real. Sin pasarela automática.
5. Reporte: `/api/admin/negocios-reporte?negocioId=X&dias=30` → CSV.

## Planes (hipótesis, configurables en panel)

Básico US$10 · Destacado US$15 · Premium US$25 /mes. Se crean desde el panel
(botón "Crear planes iniciales") — son editables, no precios fijos en código.
No hay cobros automáticos ni pasarela.

## 20 prospectos reales (fuentes públicas, sin contacto inventado)

Verificado 2026-10-21. **Son candidatos a prospectar, no clientes ni anunciantes.**

| # | Negocio | Categoría | Depto | Fuente pública |
|---|---------|-----------|-------|----------------|
| 1 | The Garden Cafe | Restaurantes | Granada | gardencafegranada.com (+505 2552 8582) |
| 2 | Kathy's Waffle House | Restaurantes | Granada | intur.gob.ni (+505 2552 8401) |
| 3 | Típicos Pinoleros | Restaurantes | Managua | tipicospinoleros.com (+505 5866 4787) |
| 4 | Asados Doña Tania | Restaurantes | Managua | asados-tania.vercel.app |
| 5 | Fritanga NICA | Restaurantes | Managua | foodyas.com (+505 8988 2398) |
| 6 | Los Ranchos | Restaurantes | Managua | intur.gob.ni (+505 2266 0526) |
| 7 | La Gran Francia | Restaurantes | Granada | intur.gob.ni (+505 2552 6000) |
| 8 | ViaVia León | Turismo y hospedaje | León | leon.viavia.world |
| 9 | Hotel El Convento | Turismo y hospedaje | León | elconventonicaragua.com |
| 10 | Hotel Los Patios | Turismo y hospedaje | Granada | lospatiosgranada.com (+505 2552 0641) |
| 11 | Selva Negra | Turismo y hospedaje | Matagalpa | selvanegra.com (+505 8100 9100) |
| 12 | Vapues Tours | Turismo y hospedaje | Managua | vapuestours.com (+505 2270 1936) |
| 13 | Careli Tours | Turismo y hospedaje | Managua | carelitours.com (+505 8465 1284) |
| 14 | Librería Hispamer | Comercio y tiendas | Managua | hispamer.com.ni (+505 8460 0593) |
| 15 | Gonper Librerías | Comercio y tiendas | Managua | gonperlibrerias.com (+505 2270 6272) |
| 16 | Librería Jardín | Comercio y tiendas | Managua | libreriajardin.com (PBX 2264 8888) |
| 17 | Óptica Matamoros | Salud | Managua | opticasmatamoros.com (+505 8928 1888) |
| 18 | Ópticas Visión | Salud | Managua | opticasvision.com.ni (+505 2266 5030) |
| 19 | DentalCare Nicaragua | Salud | Managua | dentalcarenicaragua.com (+505 8668 8471) |
| 20 | NicaVets | Veterinaria | Granada | nicavets.com |

## Experimento: 3 pilotos en 14 días

Objetivo: **3 pilotos gratuitos → conversión a pago**. El piloto existe para
que el negocio vea el reporte de contactos reales; no valida disposición a
pagar por sí solo, por eso está acotado en código.

### Reglas del piloto gratuito (forzadas en `campanaSchema` + `saveCommercial`)

- `estadoPago = 'piloto'`: **importe cero**, sin `referenciaPago`, sin
  `pagoConfirmado`, sin `renovacionDe` — es un período de prueba, no ingreso.
- **Duración máxima**: 45 días naturales inclusive (fechaInicio → fechaVencimiento).
- **Cupo**: máximo `PILOTOS_MAX_ACTIVOS = 3` campañas `piloto` vigentes en toda
  la plataforma (transacción serializada por `negocios_control/campanas`).
- **Debe iniciar hoy o estar vigente** al registrarse.
- Al activarlo, el perfil recibe `vigenteHasta = min(vigente actual, fin del
  piloto)`: **el perfil caduca solo cuando termina el piloto**.
- El perfil muestra la etiqueta **PILOTO GRATUITO** (no "PATROCINADO") y la nota
  aclara que no representa un pago recibido.
- Nunca suma a `cobradoUsd` ni `pendienteUsd`; aparece como `pilotosActivos`.
- Es estado final: no se edita ni se convierte en `pagado`. La continuidad es
  una campaña nueva — puede marcarse `renovacionDe` desde un piloto.
- No puede solaparse con otra campaña activa (pagada o piloto) del mismo negocio.

### Operación

1. **Día 1–2**: el propietario elige 3 negocios de la tabla (prioridad: los que
   ya conoce personalmente). Prospectos en el panel → crear perfil → aprobar →
   campaña `piloto` (30–45 días, importe 0).
2. **Durante**: el negocio ve clics reales en su perfil. Al día ~20, enviarle
   el CSV de contactos (panel → "Reporte CSV").
3. **Conversión**: proponer Básico US$10/mes. Si paga, campaña nueva `pagado`
   con `renovacionDe` = piloto + referencia real + `pagoConfirmado`, y revisar
   la vigencia del perfil. Si no paga, el perfil expira solo.



## Tareas que requieren acción humana

- Aprobar/mergear el PR de este módulo en GitHub (protección de rama activa).
- Contactar a los prospectos — **no se envían mensajes automáticamente**.
- Confirmar pagos reales antes de marcar `pagado` en el panel.
- Si se decide una pasarela (PayPal/TransferMovil), es un proyecto aparte.
- Firestore Rules: **sin cambios necesarios** — las colecciones nuevas no tienen
  regla explícita y el default-deny las protege; todo acceso es Admin SDK.

## Riesgos conocidos (aceptados en MVP)

- Rate-limit es por instancia serverless (best-effort), igual que la telemetría
  existente. Documentado, no oculto.
- Fotos son URLs externas del anunciante; sin storage propio en MVP.
- `negocios_metric_dedup` usa TTL de 24 h por documento (no TTL nativo de
  Firestore); la deduplicación efectiva es la ventana de 10 min del hash.
- WhatsApp del prospecto 3–5 (Típicos Pinoleros, Asados Tania, Fritanga NICA,
  El Rescate, Maximus) son móviles públicos; verificar antes de publicarlos.
