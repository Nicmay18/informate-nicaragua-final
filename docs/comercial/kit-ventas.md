# Kit de venta — Nicaragua Informate

> Documento de trabajo del propietario. **Nada de esto se envía automáticamente.**
> Cada cifra marcada con ⚠️ debe actualizarse con datos reales del panel el mismo
> día que se use. Un piloto gratuito no es ingreso. Un clic no es una venta.

## 1. Los dos productos

### A. Auspiciador Local (requiere PR #10 mergeado + deploy)

Franja "Auspiciado por [NOMBRE]" con logo y enlace dentro de los artículos,
durante 30 días, con medición de impresiones, clics y CTR desde el panel.

### B. Perfil en el Directorio Negocios (requiere PR #15 mergeado)

Página propia del negocio en `/negocios/[nombre]`: descripción, fotos,
horarios, ubicación y botón directo a WhatsApp/teléfono/web con clics medibles,
etiquetado como contenido comercial. Revisado editorialmente antes de publicar.

## 2. Beneficios concretos (lo que sí podemos decir)

- Visibilidad medible frente a una audiencia nicaragüense real.
- Reporte descargable (CSV) con vistas y clics por canal, por día.
- Enlace directo a WhatsApp del negocio con un toque.
- Presencia en un medio con política editorial publicada.

## 3. Lo que nunca prometemos

- Ventas, clientes, llamadas ni conversaciones garantizadas.
- Números de tráfico futuros ("te va a llegar X gente").
- Posicionamiento en Google.
- Que el clic fue una persona real interesada (los contadores son best-effort).

## 4. Precios propuestos (hipótesis — configurables en el panel)

| Plan | Precio sugerido | Contenido |
|---|---|---|
| Básico | US$10/mes | Perfil completo + enlace de contacto + reporte mensual |
| Destacado | US$15/mes | Básico + posición preferente en su categoría |
| Premium | US$25/mes | Destacado + portada del directorio + reporte quincenal |
| Piloto gratuito | US$0 | Máx 45 días, máx 3 simultáneos, nunca se reporta como ingreso |

Los precios son hipótesis a validar con los 3 primeros clientes. No hay
cobro automático: el pago se coordina por WhatsApp/transferencia y se
registra en el panel solo después de confirmarlo.

## 5. Ejemplo de perfil (plantilla — no un negocio real publicado)

```
Nombre:       [Nombre del negocio]
Categoría:    Comercio y tiendas
Departamento: Managua
Descripción:  [Qué vende, a quién, en qué zona — 2 líneas, verificable]
Horario:      L–S 9:00–18:00
Dirección:    [Dirección pública del local]
WhatsApp:     505 XXXX XXXX (solo dígitos internacionales en el sistema)
Fotos:        2–3 URLs de fotos autorizadas por el negocio
```

Antes de publicar: confirmar con el negocio nombre, dirección, horario,
canal de contacto y permiso para usar sus fotos.

## 6. Mensajes (texto editable — enviar manualmente)

### Primer contacto

> Hola [nombre], soy [tu nombre] de Nicaragua Informate, un medio digital
> nicaragüense. Estamos abriendo un directorio de negocios locales y me
> gustaría ofrecerte un perfil gratuito durante 30 días para probarlo —
> sin costo y sin compromiso. Publicamos tu información, horarios y un
> botón directo a tu WhatsApp, y al final te entrego un reporte de cuántas
> vistas y clics recibiste. Si te sirve, después podés continuar desde
> US$10 al mes; si no, el perfil se retira solo. ¿Te paso la info?

### Seguimiento (si no responde en 3–5 días)

> Hola [nombre], te escribí hace unos días sobre el perfil gratuito de
> [negocio] en el directorio de Nicaragua Informate. Solo quedan [N]
> espacios de prueba este mes. ¿Te interesa que te lo prepare? No te
> cuesta nada y ves los resultados con números reales.

### Cierre del piloto (día ~25–30)

> Hola [nombre], terminó el mes de prueba de [negocio]. Te comparto el
> reporte: tu perfil tuvo [N] vistas y [N] clics a WhatsApp/teléfono/web
> entre [fechas]. ¿Recibiste consultas que reconozcas de ese canal?
> Si te sirvió, el plan Básico queda en US$10/mes y conservás el perfil
> activo; si no, gracias por probar y lo retiro sin problema.

## 7. Guion WhatsApp (explicar el servicio en 4 mensajes)

1. "Es una página de tu negocio dentro del directorio de un medio digital
   nicaragüense — nombre, fotos, horario, dirección y botón de WhatsApp."
2. "Nosotros la creamos con la info que vos nos pases, la revisamos y la
   publicamos. Vos no tenés que instalar ni administrar nada."
3. "Te mando un reporte de vistas y clics para que veas si la gente la usa.
   Los clics son a tu WhatsApp — la gente te escribe directo a vos."
4. "El primer mes es gratis de prueba (solo aceptamos 3 pilotos). Después
   cuesta US$10 al mes si decidís seguir. Sin contrato ni cobro automático."

## 8. Registro de prospectos

Archivo: `docs/comercial/prospectos-seguimiento.csv` (editable en Excel/Sheets).
También existe el CRM en el panel (Prospectos) cuando #15 esté desplegado.
Columnas: negocio, contacto, canal, fecha_contacto, oferta, estado
(nuevo/contactado/interesado/negociacion/ganado/perdido), proximo_seguimiento,
resultado, notas. **Los 20 candidatos con fuentes públicas están en
`negocios-mvp.md` (rama feat/negocios-mvp) — son candidatos, no clientes.**

## 9. Reporte para el cliente

- Panel → Campañas → "Reporte CSV" (por negocio, últimos 30/90 días).
- El CSV incluye nota honesta: "los clics no equivalen a conversaciones,
  ventas ni ingresos". Entregarlo sin editar esa nota.
- Fecha de corte y rango siempre explícitos al compartir cifras.

## 10. Procedimiento de pagos, renovación y baja

1. **Cobro**: coordinar por WhatsApp (transferencia/efectivo). Recibido el
   dinero → panel → Campañas → marcar `pagoConfirmado` + `referenciaPago`
   (número de transferencia/recibo real) → guardar. Nunca antes.
2. **Renovación**: nueva campaña con `renovacionDe` = la anterior; no se
   edita la vieja (estado final). Extender `vigenteHasta` del perfil →
   vuelve a `pendiente` → re-aprobar tras revisar datos.
3. **Baja/retiro**: suspender el perfil en el panel (deja de mostrarse y
   sale del sitemap) + campaña `cancelado`. Conservar historial — el
   registro de auditoría queda en `negocios_audit`.
4. **Piloto que no convierte**: expira solo; el perfil deja de mostrarse
   al llegar a `vigenteHasta`. Confirmar retiro y agradecer.
