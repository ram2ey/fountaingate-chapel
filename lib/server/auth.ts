import 'server-only';
import { createHash, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { authTransaction } from './auth-database';
import { withTransaction } from './database';
import { can, type Capability } from '../auth/permissions';
import type { SystemUser } from '../types/church';

export const SESSION_COOKIE = 'fgc_session';
export const tokenDigest = (token: string) => createHash('sha256').update(token).digest('hex');
export const newToken = () => randomBytes(32).toString('base64url');
export type SessionUser = SystemUser & { branch_id: string; member_id?: string };

export async function readSession(token: string | undefined): Promise<SessionUser | null> {
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  return authTransaction(async client => {
    const result = await client.query<SessionUser>(`SELECT u.id,u.phone,u.email,p.full_name,m.role,s.branch_id,u.created_at
      FROM identity.sessions s JOIN identity.users u ON u.id=s.user_id JOIN public.profiles p ON p.id=u.id
      JOIN identity.memberships m ON m.user_id=u.id AND m.branch_id=s.branch_id JOIN public.branches b ON b.id=s.branch_id
      WHERE s.token_hash=$1 AND s.revoked_at IS NULL AND s.expires_at>now() AND u.disabled_at IS NULL
      AND u.phone_verified_at IS NOT NULL AND b.archived_at IS NULL AND p.archived_at IS NULL
      AND (m.role='member' OR s.mfa_verified_at IS NOT NULL)`, [tokenDigest(token)]);
    return result.rows[0] || null;
  });
}
export async function currentSession() { return readSession((await cookies()).get(SESSION_COOKIE)?.value); }
export async function authorizedTransaction<T>(capability: Capability, operation: Parameters<typeof withTransaction<T>>[0]) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const user = await readSession(token);
  if (!user || !can(user.role, capability)) throw new Error('Access denied.');
  return withTransaction(async client => {
    await client.query("SELECT set_config('fgc.session_token',$1,true)", [token]);
    // Check again in the data transaction so revoked privileges cannot use a stale session result.
    const permission = await client.query<{ allowed: boolean }>('SELECT identity.has_capability($1) AS allowed', [capability]);
    if (!permission.rows[0]?.allowed) throw new Error('Access denied.');
    return operation(client);
  });
}
export async function setSessionCookie(token: string) {
  (await cookies()).set(SESSION_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge: 8*60*60 });
}
