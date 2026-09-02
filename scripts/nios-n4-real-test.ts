import 'dotenv/config';
import { getNiosExecutiveData } from '../lib/nios/executive-center';
import { buildNiosBrief } from '../lib/nios/nios-speaks';
import {
  proposeActionsFromOpportunities,
  approveAndExecuteAction,
} from '../lib/nios/action-engine';

async function main() {
  console.log('[nios-n4-test] Obteniendo datos reales...');
  const data = await getNiosExecutiveData().catch((err) => {
    console.error('[nios-n4-test] Error al leer datos:', err);
    return null;
  });

  if (!data) {
    console.log('[nios-n4-test] No se pudo obtener datos ejecutivos.');
    return;
  }

  const brief = buildNiosBrief(data);
  console.log(`[nios-n4-test] Oportunidades detectadas: ${brief.opportunities.length}`);

  if (brief.opportunities.length === 0) {
    console.log('[nios-n4-test] No hay oportunidades hoy.');
    return;
  }

  const actions = await proposeActionsFromOpportunities(brief.opportunities);
  const first = actions[0];
  console.log('[nios-n4-test] Primera acción propuesta:', first.title, '->', first.target);

  const executed = await approveAndExecuteAction(first.id, 'nios-n4-test');
  console.log('[nios-n4-test] Estado final:', executed.status);
  console.log('[nios-n4-test] Resultado:', JSON.stringify(executed.result, null, 2));
  console.log('[nios-n4-test] After:', JSON.stringify(executed.after, null, 2));
}

main().catch((err) => {
  console.error('[nios-n4-test] Error fatal:', err);
  process.exit(1);
});
