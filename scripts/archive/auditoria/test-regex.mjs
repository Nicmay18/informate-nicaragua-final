const d = { 'trágico': 'grave', 'criminal': 'delincuente' };
let t = 'Detalles del trágico hecho en Ocotal. El criminal fue detenido.';
Object.keys(d).forEach(k => {
  t = t.replace(new RegExp(k, 'gi'), d[k]);
});
console.log('RESULTADO:', t);
