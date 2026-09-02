'use server';

import { revalidatePath } from 'next/cache';
import {
  type NiosAction,
  approveAndExecuteAction,
  rejectAction,
  getActions,
} from './action-engine';

export async function approveNiosAction(actionId: string, user?: string): Promise<NiosAction> {
  const action = await approveAndExecuteAction(actionId, user);
  revalidatePath('/panel/nios');
  return action;
}

export async function rejectNiosAction(
  actionId: string,
  reason?: string,
  user?: string,
): Promise<NiosAction> {
  const action = await rejectAction(actionId, reason, user);
  revalidatePath('/panel/nios');
  return action;
}

export async function approveAllNiosActions(actionIds: string[], user?: string): Promise<NiosAction[]> {
  const results: NiosAction[] = [];
  for (const id of actionIds) {
    try {
      const action = await approveAndExecuteAction(id, user);
      results.push(action);
    } catch (err) {
      console.error('[actions-server] approveAll falló para', id, err);
    }
  }
  revalidatePath('/panel/nios');
  return results;
}

export async function fetchNiosActions(): Promise<NiosAction[]> {
  return getActions(50);
}
