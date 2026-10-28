import { cookies } from 'next/headers';
import { verifySessionToken } from './admin-session';

export const ADMIN_SESSION_COOKIE = 'admin_session';

export async function getAdminSessionToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
}

export async function isAuthenticatedAdmin(): Promise<boolean> {
  const token = await getAdminSessionToken();
  return verifySessionToken(token);
}
