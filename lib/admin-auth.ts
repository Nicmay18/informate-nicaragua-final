import { cookies } from 'next/headers';
import { verifyAdminToken } from './auth';

export const ADMIN_SESSION_COOKIE = 'admin_session';

export async function getAdminSessionToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
}

export async function isAuthenticatedAdmin(): Promise<boolean> {
  const token = await getAdminSessionToken();
  return verifyAdminToken(token);
}
