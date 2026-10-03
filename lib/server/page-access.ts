import 'server-only';
import { redirect } from 'next/navigation';
import { currentSession } from './auth';
import { can, type Capability } from '../auth/permissions';

// Every protected page calls this: shared layouts are reused during client navigation.
export async function requirePageAccess(capability:Capability) {
  const user=await currentSession();
  if(!user)redirect('/login');
  if(!can(user.role,capability))return false;
  return true;
}
