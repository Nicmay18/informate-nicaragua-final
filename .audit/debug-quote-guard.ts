import { validateQuotesAndAttributions } from '../lib/editorial/quote-guard';

const SRC = 'Un accidente de tránsito ocurrió este viernes en la carretera Panamericana, km 32. ' +
  'La Policía Nacional informó que dos personas resultaron lesionadas y fueron trasladadas al hospital. ' +
  'Se investiga la causa del siniestro.';

const gen = '<p>El accidente fue causado por exceso de velocidad, según el conductor involucrado.</p>';
const r = validateQuotesAndAttributions(SRC, gen);
console.log(JSON.stringify(r, null, 1));
