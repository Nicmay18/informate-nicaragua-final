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

Objetivo: **3 negocios que paguen**, no 3 perfiles gratis — gratis no valida
disposición a pagar.

1. **Día 1–2**: el propietario elige 3–5 negocios de la tabla (prioridad: los que
   ya conoce personalmente). Registrar como prospectos en el panel.
2. **Día 2–7**: propuesta directa y simple: "Perfil revisado + medición de
   contactos reales por US$10/mes". El primer mes puede ofrecerse como piloto
   con descuento, pero el reporte del mes 1 debe vender la renovación a precio
   completo.
3. **Día 7–14**: al recibir pago, registrar campaña con referencia real del
   pago (transferencia, efectivo, etc.) y `pagoConfirmado`. Generar el CSV a los
   30 días y usarlo como argumento de renovación.

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
