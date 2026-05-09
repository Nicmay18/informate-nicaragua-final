# Sistema Modular de Ads - Nicaragua Informate

Sistema completo de gestión de publicidad optimizado para máxima viewability y revenue.

## 📁 Estructura

```
/js/ads/
├── core/                    # Componentes principales
│   ├── AdManager.js         # Gestor central de anuncios
│   ├── ViewabilityTracker.js # Tracking IAB compliant
│   └── RefreshController.js  # Control inteligente de refrescos
├── slots/                   # Tipos de slots de anuncios
│   ├── BaseAdSlot.js        # Clase base abstracta
│   ├── HeaderSlot.js        # Leaderboard header
│   ├── ArticleMidSlot.js    # Anuncio dentro de artículos
│   ├── SidebarSlot.js       # Sidebar sticky
│   ├── StickyFooterSlot.js  # Anchor ad footer
│   ├── InArticleSlot.js     # Anuncio nativo en flujo
│   └── ParallaxSlot.js      # Efecto parallax
├── targeting/               # Sistemas de targeting
│   ├── ContextualTarget.js  # Targeting por contenido
│   └── AudienceTarget.js    # Targeting por usuario
└── analytics/               # Métricas y analytics
    ├── AdAnalytics.js       # Tracking de eventos
    └── RevenueEstimator.js  # Estimación de ingresos
```

## 🚀 Uso Básico

### 1. Incluir Scripts en HTML

```html
<!-- Core -->
<script src="/js/ads/core/ViewabilityTracker.js"></script>
<script src="/js/ads/core/RefreshController.js"></script>

<!-- Slots -->
<script src="/js/ads/slots/BaseAdSlot.js"></script>
<script src="/js/ads/slots/HeaderSlot.js"></script>
<script src="/js/ads/slots/ArticleMidSlot.js"></script>
<script src="/js/ads/slots/SidebarSlot.js"></script>
<script src="/js/ads/slots/StickyFooterSlot.js"></script>
<script src="/js/ads/slots/InArticleSlot.js"></script>
<script src="/js/ads/slots/ParallaxSlot.js"></script>

<!-- Targeting -->
<script src="/js/ads/targeting/ContextualTarget.js"></script>
<script src="/js/ads/targeting/AudienceTarget.js"></script>

<!-- Analytics -->
<script src="/js/ads/analytics/AdAnalytics.js"></script>
<script src="/js/ads/analytics/RevenueEstimator.js"></script>

<!-- Manager (debe ir al final) -->
<script src="/js/ads/core/AdManager.js"></script>
```

### 2. Inicializar AdManager

```javascript
// Inicializar el sistema
const adManager = new AdManager({
  adsenseClient: 'ca-pub-4115203339551838',
  lazyLoadOffset: '200px',
  refreshInterval: 30000,  // 30 segundos
  maxRefreshes: 3,
  viewabilityThreshold: 0.5
});
```

### 3. Agregar Slots en HTML

```html
<!-- Header Ad -->
<div id="ad-header" 
     data-ad-slot 
     data-ad-position="header"
     data-ad-slot="1234567890">
</div>

<!-- Article Mid Ad -->
<div id="ad-article-mid" 
     data-ad-slot 
     data-ad-position="article-mid"
     data-ad-slot="0987654321">
</div>

<!-- Sidebar Ad -->
<div id="ad-sidebar" 
     data-ad-slot 
     data-ad-position="sidebar"
     data-ad-slot="1122334455">
</div>
```

## 📊 Componentes Principales

### AdManager
Gestor central que coordina todos los anuncios.

**Características:**
- Lazy loading inteligente
- Auto-refresh ético (máx 3x)
- Targeting contextual automático
- Tracking de viewability IAB
- Métricas en tiempo real

**API:**
```javascript
// Obtener slot específico
const slot = adManager.getSlot('ad-header');

// Obtener todos los slots
const allSlots = adManager.getAllSlots();

// Destruir manager
adManager.destroy();
```

### ViewabilityTracker
Tracking de visibilidad según estándares IAB.

**Estándar IAB:**
- 50% del área visible
- Durante 1 segundo continuo

**Uso:**
```javascript
const tracker = new ViewabilityTracker(element, {
  threshold: 0.5,
  minViewTime: 1000,
  onViewable: (data) => {
    console.log('Ad is viewable!', data);
  }
});

// Obtener métricas
const metrics = tracker.getMetrics();
console.log(metrics.isViewable);
console.log(metrics.totalViewableTime);
```

### RefreshController
Control inteligente de refrescos de anuncios.

**Validaciones:**
- Límite de refrescos (3x)
- Viewability mínima
- CTR mínimo
- Condiciones de red
- Tab activo

**Uso:**
```javascript
const refreshController = new RefreshController({
  refreshInterval: 30000,
  maxRefreshes: 3,
  minViewableTime: 5000,
  minCTR: 0.001
});

// Registrar slot
refreshController.register(slotId, slot, viewabilityTracker);

// Iniciar refresh
refreshController.start(slotId);

// Obtener estadísticas
const stats = refreshController.getStats();
```

### ContextualTarget
Targeting basado en contenido de la página.

**Analiza:**
- Keywords del contenido
- Categoría de la página
- Sentimiento (positivo/negativo/neutral)
- Entidades nombradas
- Topics principales

**Uso:**
```javascript
const contextual = new ContextualTarget();
const targeting = contextual.analyze();

console.log(targeting.keywords);
console.log(targeting.category);
console.log(targeting.isBrandSafe);
```

### AudienceTarget
Targeting basado en comportamiento del usuario.

**Trackea:**
- Sesiones y pageviews
- Categorías visitadas
- Intereses del usuario
- Duración de sesión
- Scroll depth
- Usuario recurrente

**Uso:**
```javascript
const audience = new AudienceTarget();
const targeting = audience.getTargetingData();

console.log(targeting.segments);
console.log(targeting.interests);
console.log(targeting.engagement);

// Verificar si es usuario de alto valor
if (audience.isHighValueUser()) {
  console.log('High value user!');
}
```

### RevenueEstimator
Estimación de ingresos por publicidad.

**Calcula:**
- Revenue por impresión
- Revenue por click
- Proyecciones mensuales
- RPM (Revenue per 1000 views)
- Métricas por slot y categoría

**Uso:**
```javascript
const estimator = new RevenueEstimator({
  cpm: 1.50,
  cpc: 0.15,
  viewableCPM: 2.00
});

// Trackear impresión
estimator.trackImpression('ad-header', {
  isViewable: true,
  category: 'tecnología',
  device: 'desktop',
  engagement: 'high'
});

// Obtener métricas
const metrics = estimator.getMetrics();
console.log(`Revenue: $${metrics.estimatedRevenue.toFixed(2)}`);
console.log(`RPM: $${metrics.rpm}`);

// Proyección mensual
const projection = estimator.projectMonthlyRevenue(50000, 4);
console.log(`Estimated monthly: $${projection.estimatedRevenue.toFixed(2)}`);
```

## 🎯 Tipos de Slots

### HeaderSlot
Leaderboard en header (728x90 desktop, 320x50 mobile)

### ArticleMidSlot
Anuncio rectangular dentro de artículos (300x250)

### SidebarSlot
Anuncio sticky en sidebar (300x600)

### StickyFooterSlot
Anchor ad en footer (320x50 mobile)

### InArticleSlot
Anuncio nativo en flujo de contenido

### ParallaxSlot
Anuncio con efecto parallax (experimental)

## 📈 Métricas y Analytics

### Eventos Trackeados

- `ad_loaded` - Anuncio cargado
- `ad_viewable` - Anuncio viewable (IAB)
- `ad_refreshed` - Anuncio refrescado
- `ad_click` - Click en anuncio

### Escuchar Eventos

```javascript
window.addEventListener('refresh-controller:refresh', (e) => {
  console.log('Ad refreshed:', e.detail);
});
```

## 🔧 Configuración Avanzada

### Personalizar Tasas de Revenue

```javascript
const estimator = new RevenueEstimator({
  rates: {
    cpm: 2.00,
    cpc: 0.20,
    viewableCPM: 2.50
  }
});
```

### Ajustar Multiplicadores por Categoría

```javascript
estimator.categoryMultipliers = {
  'finanzas': 3.0,
  'tecnología': 2.5,
  'general': 1.0
};
```

## 📊 Proyecciones de Revenue

### Ejemplo: 50K visitas mensuales

```javascript
const estimator = new RevenueEstimator();
const projection = estimator.projectMonthlyRevenue(50000 / 30, 4);

console.log(`
  Visitas mensuales: ${projection.monthlyPageViews.toLocaleString()}
  Impresiones: ${projection.monthlyImpressions.toLocaleString()}
  Viewable: ${projection.viewableImpressions.toLocaleString()}
  Clicks estimados: ${projection.estimatedClicks}
  Revenue estimado: $${projection.estimatedRevenue.toFixed(2)}
`);
```

**Proyección esperada:**
- 50K visitas/mes
- 4 ads por página
- Revenue: $1,200 - $2,000/mes

## 🚨 Mejores Prácticas

1. **Lazy Loading**: Siempre usar lazy loading para mejor performance
2. **Viewability**: Priorizar viewability sobre cantidad de ads
3. **Refresh Ético**: Máximo 3 refrescos por slot
4. **Brand Safety**: Evitar ads en contenido sensible
5. **UX First**: No degradar experiencia del usuario
6. **Mobile First**: Optimizar para dispositivos móviles
7. **Analytics**: Monitorear métricas constantemente

## 🔍 Debugging

```javascript
// Ver métricas del AdManager
console.log(adManager.metrics);

// Ver estado de un slot
const slot = adManager.getSlot('ad-header');
console.log(slot.getPerformanceMetrics());

// Ver estadísticas de refresh
const stats = refreshController.getStats();
console.log(stats);
```

## 📝 Notas

- Todos los componentes son independientes y reutilizables
- Compatible con AdSense y otros ad networks
- Cumple con estándares IAB
- Optimizado para Nicaragua (tasas locales)
- GDPR/Privacy friendly (no PII tracking)

## 🎯 Roadmap

- [ ] Integración con Google Ad Manager
- [ ] A/B testing de posiciones
- [ ] Machine learning para optimización
- [ ] Dashboard de analytics en tiempo real
- [ ] Integración con más ad networks
