'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import { isAuthenticatedAdmin } from '@/lib/admin-auth';
import { runRepairEngine, type NiosRepairEngineResult } from '@/lib/nios/repair-engine';

export async function executeNiosRepair(): Promise<NiosRepairEngineResult> {
  if (!(await isAuthenticatedAdmin())) {
    throw new Error('No autorizado');
  }

  const db = getAdminDb();
  return runRepairEngine({ db });
}
